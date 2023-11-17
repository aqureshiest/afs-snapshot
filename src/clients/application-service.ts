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
  buildAuthorizationHeaders() {
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${this.accessKey}`,
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

      if (Date.now() - exp > exp) this.token = await this.requestToken();

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
        headers: this.buildAuthorizationHeaders(),
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
   * Performs a graphql Query 
   */
  async query() {
    const { context: { logger }} = this;
    /**  
     * TODO: come up with approach for dynamically generating graphql query strings
     */    
    const graphqlQuery = {
      "query": String.raw`query ($id: String!){application(id: $id){ createdAt, id }}`,
      "variables": {id: "4640edbe-94c7-4807-8ea2-39d8a1ab867d"},
    };
    console.log('AJ DEBUG graphqlQuery', graphqlQuery);

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
   /**
    * TDOO: come up with approach for dynamically generating graphql mutation strings
    */
   try {
     const response = await axios({
       method: "post",
       url: 'http://host.docker.internal:4500/graphql',
       data: {
         query: "apply-flow-service",
         meta: {
           service: "service"
         },

       },
       headers: this.buildAuthorizationHeaders(), 
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