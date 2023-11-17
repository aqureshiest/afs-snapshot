import Plugin from "@earnest-labs/microservice-chassis/Plugin.js";
import PluginContext from "@earnest-labs/microservice-chassis/PluginContext.js";
import ApplicationServiceClient from "./application-service.js";

export const plugin: Plugin = {
  name: "clients",
  version: "1.0.0",
  registerOrder: 0,
  register: async (context: PluginContext ) => {
    const client = new ApplicationServiceClient(context);
    // const test = await client.getToken();
    // console.log('AJ DEBUG ', test);
    
    console.log('AJ DEBUG query response ', await client.query());
    
    /**
     * TODO:
     * Check if client has a token
     * and if that token has expired. Token expires after 30 minutes
     *
     */
    // set the graphlql client on the context; 
  },
};
