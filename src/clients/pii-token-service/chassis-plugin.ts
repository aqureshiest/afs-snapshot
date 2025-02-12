import Plugin from "@earnest-labs/microservice-chassis/Plugin.js";
import PluginContext from "@earnest-labs/microservice-chassis/PluginContext.js";
import PiiTokenServiceClient from "./index.js";
import SensitiveString from "@earnest-labs/ts-sensitivestring";

export const plugin: Plugin<PiiTokenServiceClient> = {
  name: "piiTokenServiceClient",
  version: "1.0.0",
  registerOrder: 0,
  register: async (context: PluginContext) => {
    const accessKey =
      SensitiveString.ExtractValue(context.env.PII_TOKEN_SERVICE_KEY) || "";
    const baseUrl =
      SensitiveString.ExtractValue(context.env.PII_TOKEN_SERVICE_BASEURL) || "";

    const client = new PiiTokenServiceClient(accessKey, baseUrl);

    plugin.instance = client;
  },
};
