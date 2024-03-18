import Plugin from "@earnest-labs/microservice-chassis/Plugin.js";
import PluginContext from "@earnest-labs/microservice-chassis/PluginContext.js";
import AnalyticsServiceClient from "./index.js";
import SensitiveString from "@earnest-labs/ts-sensitivestring";

export const plugin: Plugin<AnalyticsServiceClient> = {
  name: "analyticsServiceClient",
  version: "1.0.0",
  registerOrder: 0,
  register: async (context: PluginContext) => {
    const apiKey =
      SensitiveString.ExtractValue(context.env.ANALYTICS_SEGMENT_API_KEY) || "";

    const client = new AnalyticsServiceClient(context, apiKey);

    plugin.instance = client;
  },
};
