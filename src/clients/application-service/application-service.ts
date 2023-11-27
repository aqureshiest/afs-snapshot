import { Client } from "@earnest/http";
import * as gql from 'gql-query-builder'

export default class ApplicationServiceClient extends Client {
  private accessKey: string;
  private options: { baseUrl: string };
  private token: string;
  mutationSchema;
  
  constructor(accessKey: string) {
    const options = { baseUrl: "http://host.docker.internal:4500"}
    
    super(options);
    this.accessKey = accessKey;
  }

  get headers() {
    return {
      ...super.headers,
      "Content-Type": "application/json",
      Accept: "application/json"
    };
  }

  /**
   * Requests a new JWT if one doesnt exist or if the current token is expired
   */
   async getToken(): Promise<string> {
    const { token } = this;

    if (token) {
      const split = token.split(".");

      const payload = JSON.parse(
        Buffer.from(split[1], "base64").toString("utf8")
      );

      const { exp } = payload;

      if (((Date.now() / 1000) - exp) > exp) {
        this.token = await this.requestToken();
      }

    } else {
      this.token = await this.requestToken();
    }

    return this.token;
  }

/**
 * Requests a new JWT from application-service
 */ 
  async requestToken(): Promise<string> {
    try {
      const { results, response } = await this.post({
        uri: "/auth",
        headers: {
          ...this.headers,
          Authorization: `Bearer ${this.accessKey}`
        },
        body: {
          sub: "apply-flow-service",
          // TODO: where will we derive email from? request artifacts?
          email: "todo@earnest.com"
        }
      }) as RequestTokenResponse;

      if (response.statusCode! >= 400) {
        throw new Error(response.statusMessage);
      }

      return results.token;
    } catch (error) {

      throw error;
    }
  }

  /**
   * Generates graphql fields given a list of strings, where each string represents a detail on a given application,
   * and composite details are delineated by a "."
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
            query = query + `${field} { `
          }
        }
      }

      return acc;
    }, "");
  }

  /**
   * Query application-service 
   */
  async query(applicationId: string): Promise<Application>{
    // for example ...
    const fields = this.generateFields(["id", "createdAt", "deletedAt", "name.first", "income.type"]).split(",");

    const dynamicQuery = gql.query({
      operation: 'application',
      variables: { id: {value: applicationId, required: true}},
      fields: [...fields]
    });

    try {
      const jwt = await this.getToken();

      const { results, response } = await this.post({
        uri: "/graphql",
        headers: {
          ...this.headers,
          Authorization: `Bearer ${jwt}`
        },
        body: dynamicQuery
      }) as QueryResponse;

      if (response.statusCode! >= 400) {
        throw new Error(response.statusMessage);
      }

      return results.data.application;
    } catch(error) {

      throw error;
    }
  }

  processVariables(variables, types) {
    const vars = {};

    if (!variables) return vars;

    for (const [key, val] of Object.entries(variables)) {
      Object.assign(vars, {[key]: { value: val, type: types[key] } })
    }

    return vars;
  }

  async mutate(operation: string, fields: Array<string>, data) {
    const { applicationId, ...rest } = data;

    const mutationFields = this.generateFields(fields).split(",");

    const types = this.mutationSchema[operation];

    const vars = this.processVariables(rest, types);

    const mutation = gql.mutation({
      operation,
      variables: {
        ...(applicationId ? { id: { value: applicationId, required: true } } : null),
        ...(vars),
      },
      fields: [...mutationFields]
    });

    try {
      const jwt = await this.getToken();

      const { results, response} = await this.post({
        uri: "/graphql",
        headers: {
          ...this.headers,
          Authorization: `Bearer ${jwt}`
        },
        body: mutation
      });

      //  return response.data;
    } catch (error) {

      throw error;
    }
  }

  async getSchema() {
    const query = `query shcema {
      __type(name: "Mutation") {
        name
		    fields {
					name
					args {
						name
						type {
							name
							kind
							ofType {
								name
							}
						}
					}
				}
      }
    }`;

    try {
      const jwt = await this.getToken();

      const { results, response } = await this.post({
        uri: "/graphql",
        headers: {
          ...this.headers,
          Authorization: `Bearer ${jwt}`
        },
        body: {
          query
        }
      }) as SchemaReponse;

      return results.data;
    } catch (error) {

      throw error;
    }
  }

  processSchema(fields) {
    try {
      return fields.reduce((acc, field) => {
        const { name: fieldName, args } = field;

        const graphqlInputs = args.reduce((argAcc, arg) => {
         const { name: argName, type: { kind, name: typeName, ofType } } = arg;

         if (kind === "INPUT_OBJECT") {
          argAcc[argName] = typeName
         }

         if (kind === "LIST") {
          argAcc[argName] = `[${ofType.name}]`;
         }

         if (kind === "NON_NULL") {
          argAcc[argName] = `${ofType.name}!`
         }

         return argAcc;
        }, {});
        
        acc[fieldName] = graphqlInputs;

        return acc;
      }, {});
    } catch (error) {

      throw error;
    }
  }
}