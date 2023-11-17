import  type { PluginContext } from "@earnest-labs/microservice-chassis/PluginContext.js";
import SensitiveString from "@earnest-labs/ts-sensitivestring";
import type { Jwt, JwtPayload, SignOptions, VerifyOptions } from "jsonwebtoken";
import axios from 'axios';

export default class ApplicationServiceClient {
  private context: PluginContext;
  private accessKey: string;
  private token: string;

  constructor(context: PluginContext) {
    const key = SensitiveString.ExtractValue(context.env.ACCESS_KEY) || "";
  
    this.accessKey = Buffer.from(key).toString("base64");
    this.context = context;
  }

  /**
   * Builds authorization headers for a given request
   */
  buildAuthorizationHeaders(token) {
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };
  }

  /**
   * Requests a new JWT if one doesnt exist or 
   * the current token is expired
   */
  async getToken(): Promise<string> {
    const { token } = this;

    if (token) {
      const split = token.split(".");

      const payload = JSON.parse(
        Buffer.from(split[1], "base64").toString("utf8")
      );

      const { exp } = payload;

      if (((Date.now() / 1000) - exp) > exp) this.token = await this.requestToken();

    } else { 
      this.token = await this.requestToken();
    }
    
    return this.token;
  }

/**
 * Requests a new JWT from application-service
 */ 
  async requestToken(): Promise<string> {
    const { context: { logger } } = this;

    try {
      const { data } = await axios({
        method: "post",
        url: 'http://host.docker.internal:4500/auth',
        data: {
          sub: "apply-flow-service",
          email: "test@earnest.com",
        },
        headers: this.buildAuthorizationHeaders(this.accessKey),
      });
     
      return data.token;
    } catch (error) {
      logger.error({
        message: "Failed to request JWT from application-service",
        error: error.message,
      });

      throw error;
    }
  }

  /**
   * Schema
   */
  async getSchema() {
    const { context: { logger } } = this;

    const jwt = await this.getToken();

    const query = `query shcema {
      __type(name: "Application") {
        name
        fields {
          name
          type {
            kind
            ofType {
              kind
              name
              fields {
                name
              }
            }
            fields {
              name
            }
          }
        }
      }
    }`

    try {
      const { data } = await axios({
        method: "post",
        url: 'http://host.docker.internal:4500/graphql',
        data: {
          query,
        },
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${jwt}`
         }, 
      });

      return data;
    } catch (error) {
      logger.error({
        message: "Failed to query application-service",
        error: error.message
      });

      throw error;
    }
  }

  processSchema(schema) {
    const processed = schema.data.__type.fields.reduce((acc, field) => {
      if (!field.fields && field.type.kind === "SCALAR") {
        return acc + field.name + '\n';
      }

      if (field.type.fields) {
        return acc + ` ${field.name}: {${(field.type.fields.map((c) => `${c.name}`))}}\n`
      }

      if (!field.fields && field.type.kind === "LIST" && field.type.ofType.fields) {
        return acc + ` ${field.name}: {${(field.type.ofType.fields.map((c) => `${c.name}`))}}\n`
      }

      return acc;
    }, "");

    return `{ ${processed} }`;
  }

  /**
   * Performs a graphql Query 
   */
  async query() {
    const { context: { logger }} = this;

    // const graphqlQuery = gql.query({ 
    //   operation: 'application',
    //   variables: { id: {value: "4640edbe-94c7-4807-8ea2-39d8a1ab867d", required: true}},
    //   fields: ['createdAt', 'id']
    // });

    // console.log('AJ DEBUG graphqlQuery', graphqlQuery);
    /**
     * TODO: come up with approach for dynamically generating graphql query strings
     */
    const placeholder = "";
    try {
      const response = await axios({
        method: "post",
        url: 'http://host.docker.internal:4500/graphql',
        data: {
          query: this.processSchema(await this.getSchema()),
          meta: {
            service: "apply-flow-service"
          },

        },
        headers: {
          'Content-Type': 'application/json',
          Authorization: await this.getToken(),
        }
      });

      return response.data;
    } catch (error) {
      logger.error({
        message: "Failed to query application-service",
        error: error.message
      });

      throw error;
    }
  }

  async mutate() {
   const { context: { logger }} = this;

   const jwt = await this.getToken();
   /**
    * TDOO: come up with approach for dynamically generating graphql mutation strings
    */
   const createAppMutation = `
      mutation createApplication {
        createApplication(relationships: null, meta: { service: "test" } ) {
          id
          application {
            id
          }
        } 
      }
      `
   try {
     const response = await axios({
       method: "post",
       url: 'http://host.docker.internal:4500/graphql',
       data: {
         query: createAppMutation,
         meta: {
           service: "apply-flow-service"
         },
       },
       headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${jwt}`
       }, 
     });

     return response.data;
   } catch (error) {
    logger.error({
      message: "Failed to apply mutation to application-service",
      error: error.message,
    });

    throw error;
   }
  }
}