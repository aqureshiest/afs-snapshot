import Plugin from "@earnest-labs/microservice-chassis/Plugin.js";
import PluginContext from "@earnest-labs/microservice-chassis/PluginContext.js";
import ApplicationServiceClient from "./index.js";
import SensitiveString from "@earnest-labs/ts-sensitivestring";

export const plugin: Plugin<ApplicationServiceClient> = {
  name: "applicationServiceClient",
  version: "1.0.0",
  registerOrder: 0,
  register: async (context: PluginContext) => {
    const key = SensitiveString.ExtractValue(context.env.ACCESS_KEY) || "";
    const accessKey = Buffer.from(key).toString("base64");
    const baseUrl =
      SensitiveString.ExtractValue(context.env.APPLICATION_SERVICE_URL) || "";

    const client = new ApplicationServiceClient(context, accessKey, baseUrl);

    plugin.instance = client;
  },
};
