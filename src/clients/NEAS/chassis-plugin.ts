import Plugin from "@earnest-labs/microservice-chassis/Plugin.js";
import PluginContext from "@earnest-labs/microservice-chassis/PluginContext.js";
import SensitiveString from "@earnest-labs/ts-sensitivestring";
import NeasClient from "./index.js";

export const plugin: Plugin<NeasClient> = {
  name: "NeasClient",
  version: "1.0.0",
  registerOrder: 0,
  register: async (context: PluginContext) => {
    const accessKey =
      SensitiveString.ExtractValue(context.env.S2S_APPLICATION_SERVICES_KEY) ||
      "";
    const baseUrl =
      SensitiveString.ExtractValue(context.env.NEAS_BASE_URL) || "";

    // [TODO: INF-8996] this is a temporary workaround until NEAS gets an internal api gateway
    const TEMP_cloudflareKey = SensitiveString.ExtractValue(
      context.env.TEMP_CLOUDFLARE_KEY,
    );

    const client = new NeasClient(baseUrl, accessKey, TEMP_cloudflareKey);

    plugin.instance = client;
  },
};
