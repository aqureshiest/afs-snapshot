import Plugin from "@earnest-labs/microservice-chassis/Plugin.js";
import PluginContext from "@earnest-labs/microservice-chassis/PluginContext.js";
import ApplicationServiceClient from "./application-service.js";

export const plugin: Plugin<ApplicationServiceClient> = {
  name: "applicationServiceClient",
  version: "1.0.0",
  register: async (context: PluginContext ) => {
    const client = new ApplicationServiceClient(context);

    // const queryResponse = await client.query('d258886d-5f68-45d4-affe-60de184c19bc');
    // console.log("[5f0352f4] queryResponse", JSON.stringify(queryResponse, null, 2));
    /**
     * TODO:
     * Check if client has a token
     * and if that token has expired. Token expires after 30 minutes
     *
     */
    // set the graphlql client on the context; 
    plugin.instance = client;
  }
};
