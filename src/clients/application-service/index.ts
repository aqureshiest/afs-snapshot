import PluginContext from "@earnest-labs/microservice-chassis/PluginContext.js";
import { Client } from "@earnest/http";
import * as gql from "gql-query-builder";

import { mutationSchemaQuery } from "./graphql.js";

export default class ApplicationServiceClient extends Client {
  private accessKey: string;
  private token: string;
  private mutationSchema;
  private logger;

  constructor(context: PluginContext, accessKey: string, baseUrl: string) {
    const { logger } = context;
    const options = { baseUrl };

    super(options);
    this.accessKey = accessKey;
    this.logger = logger;
  }

  get headers() {
    return {
      ...super.headers,
      "Content-Type": "application/json",
      Accept: "application/json",
    };
  }

  async start(...injections): Promise<void> {
    const context: PluginContext = injections[0];

    await this.getSchema(context, mutationSchemaQuery)
      .then((schema) => {
        this.mutationSchema = schema;
      }).catch((error) => {
        this.logError(error, "Failed to get schema on start");
      });
  
    return await super.start();
  }

  /* ============================== *
   * I. Public Queries and Mutations
   * ============================== */

  /**
   * Fetches an application and any specified fields
   * @param context PluginContext
   * @param applicationId string
   * @param fields Array<string>
   * @returns {Promise<Application>}
   */
  async getApplication(
    context: PluginContext,
    applicationId: string,
    fields: Array<string> = [],
  ): Promise<Application> {
    try {
      if (!applicationId) throw new Error("missing application id");

      const applicationFields = this.generateFields(fields).split(",");

      const applicationQuery = gql.query({
        operation: "application",
        variables: { id: { value: applicationId, required: true } },
        fields: ["id", ...applicationFields],
      });

      const { application } = await this.sendPostRequest(
        context,
        applicationQuery,
      ) as ApplicationResponse;

      return application;
    } catch (error) {
      this.logError(error, "Failed to get appliction");
      throw error;
    }
  }

  /**
   * Query application-service for a given resource
   * @param context PluginContext
   * @param query string
   * @param options Object
   * @returns {Promise<Application | Array<Application>>}
   */
  async query(
    context: PluginContext,
    query: string,
    options: QueryOptions,
  ): Promise<Application | Array<Application>> {
    try {
      const { id, referenceId, fields = [], meta } = options;

      if (!id && !referenceId)
        throw new Error("unique id for identifying resource is undefined");

      const queryFields = this.generateFields(fields).split(",");

      const gqlQuery = gql.query({
        operation: query,
        variables: {
          ...(id ? { id: { value: id, required: true } } : {}),
          ...(referenceId
            ? { referenceId: { value: referenceId, required: true } }
            : {}),
          ...(meta
            ? { meta: { value: meta, required: true, type: "EventMeta" } }
            : {}),
        },
        fields: ["id", ...queryFields],
      });

      const result = await this.sendPostRequest(
        context,
        gqlQuery
      ) as Application | Array<Application>;

      return result;
    } catch (error) {
      this.logError(error, "Failed to query application-service");
      throw error;
    }
  }

  /**
   * Performs a graphql mutation
   * @param context PluginContext
   * @param event string
   * @param options Object
   * @returns {Promise<Mutation>}
   */
  async mutate(
    context: PluginContext,
    event: string,
    options: MutationOptions,
  ): Promise<Mutation> {
    try {
      const {
        id,
        fields = [],
        data = {},
        meta
      } = options;

      if (!event) {
        throw new Error("missing mutation event");
      }
      /**
       * Reattempt to get the mutation schema if the inital request failed on start
       */
      if (!this.mutationSchema) {
        await this.getSchema(context, mutationSchemaQuery)
          .then((schema) => {
            this.mutationSchema = schema;
          }).catch((error) => {
            this.logError(error, "Reattempt to get mutation schema failed. Unable to apply mutation");
            throw error;
          });
      }

      const types = this.mutationSchema[event]; // graphql types for mutation
      const vars = this.processVariables(data, types);
      const mutationFields = this.generateFields(fields).split(",");

      const gqlMutation = gql.mutation({
        operation: event,
        variables: {
          ...(id ? { id: { value: id, required: true, type: "UUID" } } : {}),
          ...vars,
          ...(meta
            ? { meta: { value: meta, required: true, type: "EventMeta" } }
            : {}),
        },
        fields: ["id", ...mutationFields],
      });

      const result = await this.sendPostRequest(
       context,
       gqlMutation
      ) as Mutation;

      return result;
    } catch (error) {
      this.logError(error, "Failed to apply mutation");
      throw error;
    }
  }

  /* ============================== *
   * II. Private Methods
   * ============================== */

  /**
   * Generic handler for performing graphql queries and mutations
   * @param context PluginContext
   * @param body Object
   * @returns Object
   */
  private async sendPostRequest(context: PluginContext, body) {
    try {
      const jwt = await this.getToken();

      const { results, response } = (await this.post({
        uri: "/graphql",
        headers: {
          ...this.headers,
          Authorization: `Bearer ${jwt}`,
        },
        body,
        resiliency: {
          attempts: 3,
          delay: 100,
          timeout: 10000,
          test: ({ response }) => Boolean(response.statusCode && response.statusCode <= 500),
        }
      })) as GqlResponse;

      if (response.statusCode !== 200) {
        throw new Error(response.statusMessage);
      }

      return results.data;
    } catch (error) {
      this.logError(error, "Graphql request handler failed");
      throw error;
    }
  }

  /**
   * Requests a new JWT if the current token is expired or if one doesnt exist
   * @returns {Promise<string>}
   */
  private async getToken(): Promise<string> {
    const { token } = this;

    if (token) {
      const split = token.split(".");

      const jwtPayload = JSON.parse(
        Buffer.from(split[1], "base64").toString("utf8"),
      );

      const { exp } = jwtPayload;

      if (Date.now() / 1000 - exp > exp) {
        this.token = await this.requestToken();
      }
    } else {
      this.token = await this.requestToken();
    }

    return this.token;
  }

  /**
   * Requests a new JWT from application-service
   * @returns {Promise<string>}
   */
  private async requestToken(): Promise<string> {
    try {
      const { results, response } = (await this.post({
        uri: "/auth",
        headers: {
          ...this.headers,
          Authorization: `Bearer ${this.accessKey}`,
        },
        body: {
          sub: "apply-flow-service",
          // TODO: where will we derive email from? request artifacts?
          email: "todo@earnest.com",
        },
      })) as RequestTokenResponse;

      if (response.statusCode !== 200) {
        throw new Error(response.statusMessage);
      }

      return results.token;
    } catch (error) {
      this.logError(error, "Failed to request jwt from application-service");
      throw error;
    }
  }

  /**
   * Orchestrates setting a specified schema given a graphql introspection query
   * @param context PluginContext
   * @param query string
   * @returns Object
   */
  private async getSchema(context, query: string) {
    return await this.sendPostRequest(context, { query }).then((rawSchema) => {
      return this.processSchema(rawSchema); 
    }).catch((error) => {
      this.logError(error, "Failed to get and process schema");
      throw error;
    });
  }

  /**
   * Reduces schema fields down to an object whose key / value pairs represent
   * an argument and its respective grahpql type for a given event
   * @param schema ISchemaResponse
   * @returns Object
   */
  private processSchema(schema) {
    return schema.__type.fields.reduce((acc, field) => {
      const { name: fieldName, args } = field;

      const graphqlInputs = args.reduce((argAcc, arg) => {
        const {
          name: argName,
          type: { kind, name: typeName, ofType },
        } = arg;

        if (kind === "INPUT_OBJECT") {
          argAcc[argName] = typeName;
        }

        if (kind === "LIST") {
          argAcc[argName] = `[${ofType.name}]`;
        }

        if (kind === "NON_NULL") {
          argAcc[argName] = `${ofType.name}!`;
        }

        return argAcc;
      }, {});

      acc[fieldName] = graphqlInputs;

      return acc;
    }, {});
  }

  /**
   * Generates graphql fields given a list of strings that represent details
   * to return in a graphql query / mutation. Composite details are delineated by a "."
   * @param fields Array<string>
   * @returns string
   */
  private generateFields(queryFields: Array<string>): string {
    if (!queryFields.length) return "";

    return queryFields.reduce((acc, fieldString) => {
      const fields = fieldString.split(".");

      if (fields.length === 1) {
        acc = acc + fields[0] + ",";

        return acc;
      } else {
        let query = "";
        let depth = fields.length - 1;

        while (fields.length) {
          const field = fields.shift();

          if (!fields.length) {
            acc = acc + query + `${field}`;

            while (depth) {
              depth--;
              acc = acc + " }";

              if (!depth) {
                acc = acc + ",";
              }
            }

            return acc;
          } else {
            query = query + `${field} { `;
          }
        }
      }

      return acc;
    }, "");
  }

  /**
   * Processes gql-query-builder variables
   * @param data Object
   * @param types Object
   * @returns Object
   */
  private processVariables(data, types) {
    const vars = {};

    if (!Object.keys(data).length) return vars;

    for (const [key, val] of Object.entries(data)) {
      Object.assign(vars, { [key]: { value: val, type: types[key] } });
    }

    return vars;
  }

  private logError(error: Error, message: string) {
    this.logger.error({
      message,
      error: {
        message: error.message,
        stack: error.stack,
      },
    });
  }
}
