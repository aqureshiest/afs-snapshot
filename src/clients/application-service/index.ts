import PluginContext from "@earnest-labs/microservice-chassis/PluginContext.js";
import { Client } from "@earnest/http";
import { Request } from "express";
import * as gql from "gql-query-builder";

export default class ApplicationServiceClient extends Client {
  private accessKey: string;
  private token: string;
  mutationSchema;

  constructor(accessKey: string, baseUrl: string) {
    const options = { baseUrl };

    super(options);
    this.accessKey = accessKey;
  }

  get headers() {
    return {
      ...super.headers,
      "Content-Type": "application/json",
      Accept: "application/json",
    };
  }

  /**
   * Requests a new JWT if one doesnt exist or if the current token is expired
   */
  async getToken(context: PluginContext): Promise<string> {
    const { token } = this;

    if (token) {
      const split = token.split(".");

      const jwtPayload = JSON.parse(
        Buffer.from(split[1], "base64").toString("utf8"),
      );

      const { exp } = jwtPayload;

      if (Date.now() / 1000 - exp > exp) {
        this.token = await this.requestToken(context);
      }
    } else {
      this.token = await this.requestToken(context);
    }

    return this.token;
  }

  /**
   * Requests a new JWT from application-service
   */
  async requestToken(context: PluginContext): Promise<string> {
    const { logger } = context;

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

      if (response.statusCode! >= 400) {
        throw new Error(response.statusMessage);
      }

      return results.token;
    } catch (error) {
      logger.error({
        message: "Failed to request jwt from application-service",
        error: {
          message: error.message,
          stack: error.stack,
        },
      });

      throw error;
    }
  }

  /**
   * Fetches a schema by leveraging the graphql introspection system
   */
  async getSchema(context: PluginContext, query: string): Promise<Schema> {
    const { logger } = context;

    try {
      const jwt = await this.getToken(context);

      const { results, response } = (await this.post({
        uri: "/graphql",
        headers: {
          ...this.headers,
          Authorization: `Bearer ${jwt}`,
        },
        body: {
          query,
        },
      })) as SchemaReponse;

      if (response.statusCode! !== 200) {
        throw new Error(response.statusMessage);
      }

      return results.data;
    } catch (error) {
      logger.error({
        message: "Failed to get schema from application-service",
        error: {
          message: error.message,
          stack: error.stack,
        },
      });

      throw error;
    }
  }

  /**
   * Reduces schema fields down to an object whose key / value pairs represent
   * an argument and its respective grahpql type for a given event
   */
  processSchema(fields) {
    return fields.reduce((acc, field) => {
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
   * Genereates graphql fields given a list of strings that represent details
   * to be returned in a graphql query / mutation. Composite details are delineated by a "."
   */
  generateFields(fields: Array<string>): string {
    return fields.reduce((acc, fieldString) => {
      const fields = fieldString.split(".");

      if (fields.length === 1) {
        acc = acc + fields[0] + ",";

        return acc;
      } else {
        let query = "";

        while (fields.length) {
          const field = fields.shift();

          if (!fields.length) {
            acc = acc + query + `${field} }, `;

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
   * Given application data and argument types, process gql-query-builder
   * varibales for a new graphql request for a given operation
   */
  processVariables(data, types) {
    const vars = {};

    if (!data) return vars;

    for (const [key, val] of Object.entries(data)) {
      Object.assign(vars, { [key]: { value: val, type: types[key] } });
    }

    return vars;
  }

  /**
   * Query application-service
   */
  async query(context: PluginContext, req: Request): Promise<Application> {
    const { logger } = context;

    const { uuid: applicationId } = req.params;
    const { fields } = req.body;

    const gqlQuery = gql.query({
      operation: "application",
      variables: { id: { value: applicationId, required: true } },
      fields: [...fields],
    });

    try {
      const jwt = await this.getToken(context);

      const { results, response } = (await this.post({
        uri: "/graphql",
        headers: {
          ...this.headers,
          Authorization: `Bearer ${jwt}`,
        },
        body: gqlQuery,
      })) as QueryResponse;

      if (response.statusCode! !== 200) {
        throw new Error(response.statusMessage);
      }

      return results.data.application;
    } catch (error) {
      logger.error({
        message: "Failed to query application-service",
        error: {
          message: error.message,
          stack: error.stack,
        },
      });

      throw error;
    }
  }

  /**
   * Perform a graphlql mutation
   */
  async mutate(context: PluginContext, req: Request) {
    const { logger } = context;

    const { uuid: applicationId } = req.params;
    const { event, fields, data } = req.body;

    const mutationFields = this.generateFields(fields).split(",");

    const types = this.mutationSchema[event];

    const vars = this.processVariables(data, types);

    const gqlMutation = gql.mutation({
      operation: event,
      variables: {
        ...(applicationId
          ? { id: { value: applicationId, required: true } }
          : null),
        ...vars,
      },
      fields: [...mutationFields],
    });

    try {
      const jwt = await this.getToken(context);

      const { results, response } = (await this.post({
        uri: "/graphql",
        headers: {
          ...this.headers,
          Authorization: `Bearer ${jwt}`,
        },
        body: gqlMutation,
      })) as Mutation;

      if (response.statusCode! !== 200) {
        throw new Error(response.statusMessage);
      }

      return results.data;
    } catch (error) {
      logger.error({
        message: "Failed to apply mutation",
        error: {
          message: error.message,
          stack: error.stack,
        },
      });

      throw error;
    }
  }
}
