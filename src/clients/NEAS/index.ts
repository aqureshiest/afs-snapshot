import PluginContext from "@earnest-labs/microservice-chassis/PluginContext.js";
import * as types from "@earnest/application-service-client/typings/codegen.js";
import { Client } from "@earnest/http";

import { ADD_REFERENCE_MUTATION, NEAS_APPLICATION_QUERY } from "../application-service/graphql.js";

export default class NeasClient<Injections extends unknown[]> extends Client<Injections> {
  #accessKey: string;
  #logger: PluginContext["logger"];

  constructor(baseUrl: string, accessKey: string, context: PluginContext) {
    super({ baseUrl });
    this.#accessKey = accessKey;
    this.#logger = context.logger;
  }

  /* ============================== *
   * I. Public Methods
   * ============================== */
  /**
   * Creates a new unauthenticated identity and session for a given application
   * @param id string
   * @param injections Injections
   * @returns 
   */
  async createUnauthenticatedIdentity(
    id: string,
    ...injections: Injections
  ): Promise<Client.Response<{ authId: string, sessionToken: string }>["response"]> {
    try {
      const context = injections[0] as PluginContext;
      const applicationServiceClient = context?.loadedPlugins?.applicationServiceClient?.instance;

      if (!applicationServiceClient) {
        throw new Error("[56f9bdec] Application-service-client is not instantiated and required to create an unauthenticated identity")
      }

      const { results, response } = (await this.post(
        {
          uri: "/auth/identity/unauthenticated",
          headers: {
            ...this.headers,
            Authorization: `${this.#accessKey}`,
          },
          resiliency: {
            attempts: 3,
            delay: 100,
            timeout: 10000,
            test: ({ response }) =>
              Boolean(response.statusCode && response.statusCode <= 500),
          },
        },
        ...injections
      )) as Client.Response<{ authId: string, sessionToken: string }>;

      if (response.statusCode && response.statusCode >= 400) {
        throw new Error(response.statusMessage);
      }

      const { authId, sessionToken } = results;

      // create an authID reference for the given application
      const addReferencesEvent = await applicationServiceClient.sendRequest({
        query: ADD_REFERENCE_MUTATION,
        variables: { id, references: [{ referencedId: authId, referenceType: "authID" }], meta: "apply-flow-service" }
      }) as types.Event;

      if (addReferencesEvent.error != null) {
        throw new Error(addReferencesEvent.error);
      }

      // set the session cookie in the response headers
      response.headers["set-cookie"] = [sessionToken];

      return response;
    } catch (error) {
      this.#log({
        error: error?.message,
        message: "[5a3effd0] Failed to create guest id",
      }, "error")
      throw error;
    }
  }

  /**
   * Associates an existing authId with a given email address if one exists,
   * or creates a new authId for a given user
   * @param id string
   * @param token string
   * @param injections Injections
   * @returns Promise<Client.Response<{ authId: string, session: string }["response"]>>
   */
  async createAuthId(
    id: string,
    token: string,
    ...injections: Injections
  ): Promise<Client.Response<{ authId: string, sessionToken: string }>["response"]> {
    try {
      const context = injections[0] as PluginContext;
      const applicationServiceClient = context?.loadedPlugins?.applicationServiceClient?.instance;

      if (!applicationServiceClient) {
        throw new Error("[b0e4b066] Application-service-client is not instantiated and required to create an authId")
      }

      const { application } = await applicationServiceClient.sendRequest({
        query: NEAS_APPLICATION_QUERY,
        variables: { id }
      }) as { application: types.Application };

      if (!application) {
        throw new Error("[cc7eda2d] Application does not exist");
      }

      const { details } = application;
      
      if (details && !details?.email) {
        throw new Error("[55858b44] An email address is required to create an authId");
      }

      const { results, response } = (await this.post(
        {
          uri: "/auth/identity/authId",
          headers: {
            ...this.headers,
            Authorization: token,
          },
          body: {
            email: details?.email
          },
          resiliency: {
            attempts: 3,
            delay: 100,
            timeout: 10000,
            test: ({ response }) =>
              Boolean(response.statusCode && response.statusCode <= 500),
          },
        },
        ...injections
      )) as Client.Response<{ authId: string, sessionToken: string }>;

      if (response.statusCode && response.statusCode >= 400) {
        throw new Error(response.statusMessage);
      }

      const { authId, sessionToken } = results;

      // create an authId reference for the given application
      const addReferencesEvent = await applicationServiceClient.sendRequest({
        query: ADD_REFERENCE_MUTATION,
        variables: { id, references: [{ referencedId: authId, referenceType: "authID" }], meta: "apply-flow-service"}
      }) as types.Event;

      if (addReferencesEvent.error !== null) {
        throw new Error(addReferencesEvent.error);
      }

      response.headers["set-cookie"] = [sessionToken];

      return response;
    } catch (error) {
      this.#log({
        error: error.message,
        message: "[fdcb97cb] Failed to create authId"
      }, "error");
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
    ...injections: Injections): Promise<void> {
    try {
      const context = injections[0] as PluginContext;
      const applicationServiceClient = context?.loadedPlugins?.applicationServiceClient?.instance;

      if (!applicationServiceClient) {
        throw new Error("[a9050dc4] Application-service-client is not instantiated and required to send users an email link")
      }

      const { application } = await applicationServiceClient.sendRequest({
        query: NEAS_APPLICATION_QUERY,
        variables: { id }
      }) as { application: types.Application };

      if (!application) {
        throw new Error("[b2ca51ed] Application does not exist");
      }

      const { authID, details } = application;

      if (!authID) {
        throw new Error("[3673aadd] An authID is required to send an email link");
      }

      if (details && !details?.email) {
        throw new Error("[028aa77f] An email address is required to send an email link");
      }

      const { response } = (await this.post(
        {
          uri: "/auth/identity/access-code/send",
          headers: {
            ...this.headers,
            Authorization: token,
          },
          body: {
            applicationId: id,
            authId: authID,
            emailId: details?.email,
            expirationDate: Date.now() + (1000 * 60 * 60 * 24 * 30), // 30 days
            attributesToVerify: [
              {
                field: "firstName",
                label: "First Name"
              },
              {
                field: "lastName",
                label: "Last Name"
              }
            ]
          },
          resiliency: {
            attempts: 3,
            delay: 100,
            timeout: 10000,
            test: ({ response }) =>
              Boolean(response.statusCode && response.statusCode <= 500),
          },
        },
        ...injections
      )) as Client.Response<void>;

      if (response.statusCode && response.statusCode >= 400) {
        throw new Error(response.statusMessage);
      }
    } catch (error) {
      this.#log({
        error: error.message,
        message: "[2a7945e5] Failed to send email link",
      }, "error")
      throw error; 
    }
  }

  /* ============================== *
   * II. Private Methods
   * ============================== */
  #log(message: unknown, level?: string) {
    if (level && this.#logger[level]) {
      this.#logger[level](message);
    } else {
      this.#logger.info(message);
    }
  }
}