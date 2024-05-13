import assert from "node:assert";
import PluginContext from "@earnest-labs/microservice-chassis/PluginContext.js";
import * as types from "@earnest/application-service-client/typings/codegen.js";

import Client from "../client.js";

import {
  ADD_REFERENCE_MUTATION,
  NEAS_APPLICATION_QUERY,
} from "../application-service/graphql.js";
import { Plugin } from "ajv";

export default class NeasClient extends Client {
  get clientName() {
    return "NEAS";
  }
  #accessKey: string;

  constructor(baseUrl: string, accessKey: string) {
    super({ baseUrl });
    this.#accessKey = accessKey;
  }

  get defaultHeaders() {
    return {
      ...super.headers,
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `${this.#accessKey}`,
    };
  }

  get resiliency() {
    return {
      attempts: 3,
      delay: 100,
      timeout: 10000,
      test: ({ response }) =>
        Boolean(response.statusCode && response.statusCode <= 500),
    };
  }

  /* ============================== *
   * Public Methods
   * ============================== */
  /**
   * Creates a new unauthenticated identity and session for a given application
   * @param id string
   * @param injections Injections
   * @returns Promise<string>
   */
  async createUnauthenticatedIdentity(
    id: string,
    context: PluginContext,
  ): Promise<string> {
    try {
      const applicationServiceClient =
        context?.loadedPlugins?.applicationServiceClient?.instance;
      assert(
        applicationServiceClient,
        "[56f9bdec] Application-service-client is required to create an unauthenticated identity",
      );

      const { results, response } = await this.post<{
        authId: string;
        sessionToken: string;
      }>(
        {
          uri: "/auth/identity/unauthenticated",
          headers: this.defaultHeaders,
          resiliency: this.resiliency,
        },
        context,
      );

      if (response.statusCode && response.statusCode >= 400) {
        throw new Error(response.statusMessage);
      }

      const { authId, sessionToken } = results;

      // create an authID reference for the given application
      const addReferencesEvent = (await applicationServiceClient.sendRequest(
        {
          query: ADD_REFERENCE_MUTATION,
          variables: {
            id,
            references: [{ referencedId: authId, referenceType: "authID" }],
            meta: "apply-flow-service",
          },
        },
        context,
      )) as types.Event;

      if (addReferencesEvent.error != null) {
        throw new Error(addReferencesEvent.error);
      }

      return sessionToken;
    } catch (error) {
      this.log(
        {
          error,
          message: "[5a3effd0] Failed to create unauthenticated identity",
        },
        context,
      );
      throw error;
    }
  }

  /**
   * Associates an existing authId with an email address if one exists,
   * or creates a new authId for a given user
   * @param id string
   * @param token string
   * @param injections Injections
   * @returns Promise<string>
   */
  async createAuthId(
    id: string,
    token: string,
    context: PluginContext,
  ): Promise<string> {
    try {
      const applicationServiceClient =
        context?.loadedPlugins?.applicationServiceClient?.instance;
      assert(
        applicationServiceClient,
        "[b0e4b066] Application-service-client is required to create an authId",
      );

      const { application } = (await applicationServiceClient.sendRequest({
        query: NEAS_APPLICATION_QUERY,
        variables: { id },
      })) as { application: types.Application };
      assert(application, "[cc7eda2d] Application does not exist");

      const { details } = application;
      assert(
        details?.email,
        "[55858b44] An email address is required to create an authId",
      );

      const { results, response } = await this.post<{
        authId: string;
        sessionToken: string;
      }>(
        {
          uri: "/auth/identity/authId",
          headers: {
            ...this.defaultHeaders,
            Authorization: token, // overrides default Authorization header
          },
          body: {
            email: details?.email,
          },
          resiliency: this.resiliency,
        },
        context,
      );

      if (response.statusCode && response.statusCode >= 400) {
        throw new Error(response.statusMessage);
      }

      const { authId, sessionToken } = results;

      // create an authId reference for the given application
      const addReferencesEvent = (await applicationServiceClient.sendRequest(
        {
          query: ADD_REFERENCE_MUTATION,
          variables: {
            id,
            references: [{ referencedId: authId, referenceType: "authID" }],
            meta: "apply-flow-service",
          },
        },
        context,
      )) as types.Event;

      if (addReferencesEvent.error !== null) {
        throw new Error(addReferencesEvent.error);
      }

      return sessionToken;
    } catch (error) {
      this.log(
        {
          error,
          message: "[fdcb97cb] Failed to create authId",
        },
        context,
      );
      throw error;
    }
  }

  /**
   * Send users a email link that they can later use to resume their application
   * @param id string
   * @param token string
   * @param injections Injections
   * @returns Promise<void>
   */
  async sendEmailLink(
    id: string,
    token: string,
    context: PluginContext,
  ): Promise<void> {
    try {
      const applicationServiceClient =
        context?.loadedPlugins?.applicationServiceClient?.instance;
      assert(
        applicationServiceClient,
        "[a9050dc4] Application-service-client is not instantiated and required to send users an email link",
      );

      const { application } = (await applicationServiceClient.sendRequest(
        {
          query: NEAS_APPLICATION_QUERY,
          variables: { id },
        },
        context,
      )) as { application: types.Application };
      assert(application, "[b2ca51ed] Application does not exist");

      const { authID, details } = application;
      assert(authID, "[3673aadd] An authID is required to send an email link");
      assert(
        details?.email,
        "[028aa77f] An email address is required to send an email link",
      );

      const { response } = await this.post<void>(
        {
          uri: "/auth/identity/access-code/send",
          headers: {
            ...this.defaultHeaders,
            Authorization: token, // overrides default Authorization header
          },
          body: {
            applicationId: id,
            authId: authID,
            emailId: details?.email,
            expirationDate: Date.now() + 1000 * 60 * 60 * 24 * 30, // 30 days
            attributesToVerify: [
              {
                field: "firstName",
                label: "First Name",
              },
              {
                field: "lastName",
                label: "Last Name",
              },
            ],
          },
          resiliency: this.resiliency,
        },
        context,
      );

      if (response.statusCode && response.statusCode >= 400) {
        throw new Error(response.statusMessage);
      }
    } catch (error) {
      this.log(
        {
          error,
          message: "[2a7945e5] Failed to send email link",
        },
        context,
      );
      throw error;
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
