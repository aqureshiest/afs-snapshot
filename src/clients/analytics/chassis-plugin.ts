import Plugin from "@earnest-labs/microservice-chassis/Plugin.js";
import PluginContext from "@earnest-labs/microservice-chassis/PluginContext.js";
import AnalyticsServiceClient from "./index.js";
import SensitiveString from "@earnest-labs/ts-sensitivestring";

export const plugin: Plugin<AnalyticsServiceClient> = {
  name: "analyticsService",
  version: "1.0.0",
  registerOrder: 0,
  register: async (context: PluginContext) => {
    const apiKey =
      SensitiveString.ExtractValue(context.env.ANALYTIVS_SEGMENT_API_KEY) || "";
    const baseUrl =
      SensitiveString.ExtractValue(context.env.ANALYTICS_SERVICE_URL) || "";

    const client = new AnalyticsServiceClient(context, apiKey, baseUrl);

    plugin.instance = client;
  },
};
