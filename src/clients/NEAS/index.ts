import assert from "node:assert";
import PluginContext from "@earnest-labs/microservice-chassis/PluginContext.js";
import * as types from "@earnest/application-service-client/typings/codegen.js";

import Client from "../client.js";

import {
  ADD_REFERENCE_MUTATION,
  NEAS_APPLICATION_QUERY,
} from "../application-service/graphql.js";

export default class NeasClient extends Client {
  get clientName() {
    return "NEAS";
  }
  #accessKey: string;
  #TEMP_cloudflareKey?: string;

  constructor(baseUrl: string, accessKey: string, TEMP_cloudflareKey?: string) {
    super({ baseUrl });
    this.#accessKey = accessKey;
    this.#TEMP_cloudflareKey = TEMP_cloudflareKey;
  }

  get defaultHeaders() {
    return {
      ...super.headers,
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `${this.#accessKey}`,
      // [TODO: INF-8996] this is a temporary workaround until NEAS gets an internal api gateway
      ...(this.#TEMP_cloudflareKey
        ? { cf_neas_token: this.#TEMP_cloudflareKey }
        : {}),
    };
  }

  get resiliency() {
    return {
      attempts: 3,
      delay: 100,
      timeout: 30000,
      test: ({ response }) =>
        Boolean(response.statusCode && response.statusCode <= 500),
    };
  }

  /* ============================== *
   * Public Methods
   * ============================== */
  /**
   * Creates an accountless session
   * @param injections Injections
   * @returns Promise<void>
   */
  async createAccountlessSession(injections: Injections): Promise<void> {
    const {
      context,
      request,
      res,
    } = injections;

    const { results, response } = await this.post<{ session: string, }>(
      {
        uri: "/auth/identity/unauthenticated",
        headers: this.defaultHeaders,
        resiliency: this.resiliency,
        body: {
          applicationId: request?.params?.id,
        }
      },
      context,
    );

    if (response.statusCode && response.statusCode >= 400) {
      throw new Error(response.statusMessage);
    }

    const { session } = results;

    res.cookie("session", session, { domain: ".earnest.com" });
  }

  /**
   * Creates an accountless user and adds the returned user id as a reference
   * @param injections Injections
   * @returns Promise<void>
   */
  async createAccountlessUser(injections: Injections): Promise<void> {
    const {
      application,
      context,
      request,
      res,
    } = injections;

    const client = context.loadedPlugins.applicationServiceClient.instance;

    const applicant = application?.applicants?.find((applicant) =>
      applicant && applicant.id === request?.params?.id
    );

    const { results, response } = await this.post<{
      session: string,
      userId: string,
    }>(
      {
        uri: "/auth/identity/userId",
        headers: this.defaultHeaders,
        body: {
          email: applicant?.details?.email,
        },
        resiliency: this.resiliency,
      },
      context,
    );

    if (response.statusCode && response.statusCode >= 400) {
      throw new Error(response.statusMessage);
    }

    const { userId, session } = results;

    const { error } = await client?.sendRequest(
      {
        query: ADD_REFERENCE_MUTATION,
        variables: {
          id: applicant?.id,
          references: [{ referencedId: userId, referenceType: "userID" }],
          meta: "apply-flow-service",
        },
      },
      context,
    ) as unknown as types.Event;

    if (error) throw new Error(error);

    res.cookie("session", session, { domain: ".earnest.com" });
  }

  /**
   * Send users a email link that they can later use to resume their application
   * @param injections Injections
   * @returns Promise<void>
   */
  async sendVerificationEmail(injections: Injections): Promise<void> {
    const {
      application,
      context,
      request,
    } = injections;

    const applicant = application?.applicants?.find((applicant) =>
      applicant && applicant.id === request?.params?.id
    );

    const { response } = await this.post<void>(
      {
        uri: "/auth/identity/access-code/send",
        headers: this.defaultHeaders,
        body: {
          applicationId: applicant?.id,
          // TODO: add userID as valid reference in application-service
          // userID: application?.userID,
          emailId: applicant?.details?.email,
          expirationDate: Date.now() + 1000 * 60 * 60 * 24 * 30, // 30 days
        },
        resiliency: this.resiliency,
      },
      context,
    );

    if (response.statusCode && response.statusCode >= 400) {
      throw new Error(response.statusMessage);
    }
  }

  /**
   * Requests whether a given idToken is valid
   * @param token string
   * @param injections Injections
   * @returns Client.Response<Claims>
   */
  async verifyToken(
    token: string,
    context: PluginContext,
  ): Promise<ClientResponse<Claims>> {
    return this.post<Claims>(
      {
        uri: "/auth/interservice/verify",
        headers: this.defaultHeaders,
        body: {
          token,
        },
        resiliency: this.resiliency,
      },
      context,
    );
  }
}
