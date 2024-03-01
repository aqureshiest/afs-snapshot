import Plugin from "@earnest-labs/microservice-chassis/Plugin.js";
import PluginContext from "@earnest-labs/microservice-chassis/PluginContext.js";
import SensitiveString from "@earnest-labs/ts-sensitivestring";
import NeasClient from "./index.js";

export const plugin: Plugin<NeasClient<unknown []>> = {
  name: "NeasClient",
  version: "1.0.0",
  registerOrder: 0,
  register: async (context: PluginContext) => {
    const key = SensitiveString.ExtractValue(context.env.ACCESS_KEY) || "";
    const accessKey = Buffer.from(key).toString("base64");
    const baseUrl =
      SensitiveString.ExtractValue(context.env.APPLICATION_SERVICE_URL) || "";

    const client = new NeasClient(baseUrl, accessKey, context);

    plugin.instance = client;
  },
};
