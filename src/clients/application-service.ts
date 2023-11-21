import  type { PluginContext } from "@earnest-labs/microservice-chassis/PluginContext.js";
import SensitiveString from "@earnest-labs/ts-sensitivestring";
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
   * Performs a graphql Query 
   */
  async query(applicationId) {
    const { context: { logger }} = this;
    // for example ...
    const fields = this.generateFields(["id", "createdAt", "deletedAt", "name.first", "income.type"]).split(",");

    const dynamicQuery = gql.query({ 
      operation: 'application',
      variables: { id: {value: "9edad8c8-d624-4849-bf3f-9a47a402fe83", required: true}},
      fields: [...fields]
    });

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