import Plugin from "@earnest-labs/microservice-chassis/Plugin.js";
import PluginContext from "@earnest-labs/microservice-chassis/PluginContext.js";
import SensitiveString from "@earnest-labs/ts-sensitivestring";
import NeasClient from "./index.js";

export const plugin: Plugin<NeasClient> = {
  name: "NeasClient",
  version: "1.0.0",
  registerOrder: 0,
  register: async (context: PluginContext) => {
    const key = SensitiveString.ExtractValue(context.env.NEAS_S2S_KEY) || "";
    const accessKey = Buffer.from(key).toString("base64");
    const baseUrl =
      SensitiveString.ExtractValue(context.env.NEAS_BASE_URL) || "";

    const client = new NeasClient(baseUrl, accessKey);

    plugin.instance = client;
  },
};
