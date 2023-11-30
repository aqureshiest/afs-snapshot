import { Client } from "@earnest/http";
import * as gql from 'gql-query-builder';

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
   * Leverages graphql introspection and fetches a schema given a graphql query string
   */
  async getSchema(query): Promise<Schema> {
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

      if (response.statusCode! >= 400) {
        throw new Error(response.statusMessage);
      }

      return results.data;
    } catch (error) {

      throw error;
    }
  }

  /**
   * Reduces given schema fields down to an object representing a given graphql operation whose
   * key / value pairs represent a given argument and its respective graphql type
   */
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
   * Given request data and argument types for a given operation, process
   *  gql-query-builder varibales for a new graphql request
   */
  processVariables(data, types) {
    const vars = {};

    if (!data) return vars;

    for (const [key, val] of Object.entries(data)) {
      Object.assign(vars, {[key]: { value: val, type: types[key] } })
    }

    return vars;
  }

  /**
   * Query application-service 
   * TODO: Pass in request object. 
   * Request Object contains parameters like UUID of application
   * Also contains the request headers that contain the traceIDs
   */
  async query(applicationId: string, fieldKeys: Array<string>): Promise<Application>{
    // for example ...
    // const fields = this.generateFields(["id", "createdAt", "deletedAt"]).split(",");
    const fields = this.generateFields(fieldKeys).split(",");
    
    /**
     * TODO: Use request.params.uuid for applicationId
     */
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

  /**
   * Perform a graphlql mutation
   */
  async mutate(operation: string, fields: Array<string>, data: { [key: string]: unknown} ) {
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

      const { results, response } = await this.post({
        uri: "/graphql",
        headers: {
          ...this.headers,
          Authorization: `Bearer ${jwt}`
        },
        body: mutation
      }) as Mutation; 

      if (response.statusCode! >= 400) {
        throw new Error(response.statusMessage);
      }

      return results.data;
    } catch (error) {

      throw error;
    }
  }
}