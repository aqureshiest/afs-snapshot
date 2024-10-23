import Plugin from "@earnest-labs/microservice-chassis/Plugin.js";
import PluginContext from "@earnest-labs/microservice-chassis/PluginContext.js";
import PartnerClient from "./index.js";
import SensitiveString from "@earnest-labs/ts-sensitivestring";

export const plugin: Plugin<PartnerClient> = {
  name: "partnerClient",
  version: "1.0.0",
  registerOrder: 0,
  register: async (context: PluginContext) => {
    const baseUrl = SensitiveString.ExtractValue(context.env.PARTNER_URL) || "";

    const client = new PartnerClient(baseUrl);

    plugin.instance = client;
  },
};
