import PluginContext from "@earnest-labs/microservice-chassis/PluginContext.js";
import * as types from "@earnest/application-service-client/typings/codegen.js";

import Client from "../client.js";

import { ADD_REFERENCE_MUTATION } from "../application-service/graphql.js";

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

  get options() {
    return {
      headers: this.requestHeaders,
      resiliency: this.resiliency,
    };
  }

  get requestHeaders() {
    return {
      ...super.headers,
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${this.#accessKey}`,
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

  /**
   * Creates an accountless session
   * @param injections Injections
   * @returns Promise<void>
   */
  async createAccountlessSession(context, input): Promise<void> {
    const { application, request, response: res } = input;

    const { results, response } = await this.post<{ session: string }>(
      {
        uri: "/auth/identity/unauthenticated",
        Authorization: `${this.#accessKey}`,
        body: {
          applicationId: application?.id,
        },
        ...this.options,
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
  async createAccountlessUser(context, input): Promise<void> {
    const { application, request, response: res } = input;

    const applicant = application?.applicants?.find(
      (applicant) => applicant && applicant.id === request?.params?.id,
    );

    const { results, response } = await this.post<{
      session: string;
      userId: string;
    }>(
      {
        uri: "/auth/identity/userId",
        body: {
          email: applicant?.details?.email,
        },
        ...this.options,
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
   * Send users a email link that they can later use to resume their application
   * @param injections Injections
   * @returns Promise<void>
   */
  async sendVerificationEmail(context, input): Promise<void> {
    const { application, request } = input;

    const applicant = application?.applicants?.find(
      (applicant) => applicant && applicant.id === request?.params?.id,
    );

    const { response } = await this.post<void>(
      {
        uri: "/auth/identity/access-code/send",
        body: {
          applicationId: applicant?.id,
          // TODO: add userID as valid reference in application-service
          // userID: application?.userID,
          emailId: applicant?.details?.email,
          expirationDate: Date.now() + 1000 * 60 * 60 * 24 * 30, // 30 days
        },
        ...this.options,
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
        body: {
          token,
        },
        ...this.options,
      },
      context,
    );
  }

  /**
   * Retrieves the userID from NEAS of the given user email
   * @param context PluginContext
   * @param emailId string
   * @returns string
   */
  async getUserID(context: PluginContext, emailId: string): Promise<string> {
    const { results, response } = await this.post<UserIDs>(
      {
        uri: "/auth/users",
        body: {
          emailId: emailId,
        },
        ...this.options,
      },
      context,
    );

    if (response.statusCode && response.statusCode >= 400) {
      throw new Error(response.statusMessage);
    }
    return results?.userIdMap?.user_id;
  }
}
