import  type { PluginContext } from "@earnest-labs/microservice-chassis/PluginContext.js";
import SensitiveString from "@earnest-labs/ts-sensitivestring";
import type { Jwt, JwtPayload, SignOptions, VerifyOptions } from "jsonwebtoken";
import * as gql from 'gql-query-builder'
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

  processFields(schema) {
    const processed = schema.data.__type.fields.reduce((acc, field) => {
      console.log("036f43f0 name", field.name);
      if (!field.fields && field.type.kind === "SCALAR") {
        acc.push(field.name);

        return acc;
      }

      if (field.type.fields && field.type.name !== "Application") {
        console.log("4aabcb34 name", field.name);
        const composite = {
          [field.name]: field.type.fields.map(i => i.name),
        }
        acc.push(composite);

        return acc; 
      }

      if (!field.fields && field.type.kind === "LIST" && field.type.ofType.fields) {
        const multi = {
          [field.name]: field.type.ofType.fields.map(i => i.name)
        }
        acc.push(multi);

        return acc;
      }

      return acc;
    }, []);

    return processed;
  }

  processQuery(operation, value, schema) {
    return gql.query({
      operation,
      variables: { id: { value, required: true }},
      fields: [...this.processFields(schema)]
    });
  }

  /**
   * Performs a graphql Query 
   */
  async query(applicationId) {
    const { context: { logger }} = this;

    const graphqlQuery = {
      "query": String.raw`query ($id: String!, $meta: EventMeta!){
        application(id: $id){
          amount { approved, certified, requested },
          cognitoId,
          createdAt,
          dateOfBirth,
          deletedAt,
          education { credits, degree, enrollment, graduationDate, termEnd, termStart },
          email,
          events { event, id, data },
          id,
          income { amount, employer, end, name, start, title, type },
          lendingCheckoutId,
          lendingDecisionId,
          location { citizenship, city, state, street1, street2, zip },
          lookupHash,
          monolithUserId,
          name { first, last, middle, title },
          phone { number, type },
          product,
          tags { createdAt, deletedAt, eventId, tag },
          status(meta: $meta),
          information(meta: $meta),
          applicants { ...applicantionFields },
          benefactor { ...applicantionFields },
          beneficiary { ...applicantionFields },
          cosigner { ...applicantionFields },
          primary { ...applicantionFields },
          root { ...applicantionFields },
          serialization { ...applicantionFields },
          serialization_of { ...applicantionFields }
        }
      }
      fragment applicantionFields on Application {
        id,
        createdAt,
        deletedAt,
        name { first, last, middle, title },
        dateOfBirth,
        email,
        phone { number, type },
        income { amount, employer, end, name, start, title, type },
        location { citizenship, city, state, street1, street2, zip }
      }`,
      "variables": { id: `${applicationId}`, meta:{service:"apply-flow-service"}},
    };

    // const schema = await this.getSchema();
    // const graphqlQuery = this.processQuery('application', '9edad8c8-d624-4849-bf3f-9a47a402fe83', schema);
    console.log('[7a1314c0] graphqlQuery', graphqlQuery);

    const response = await axios({
      method: "post",
      url: 'http://host.docker.internal:4500/graphql',
      data: graphqlQuery,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${await this.getToken()}`,
      }
    }).catch((error) => {
      logger.error({
        message: "Failed to query application-service",
        error: error.message
      });

      throw error;
    });
    return response.data.data;
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