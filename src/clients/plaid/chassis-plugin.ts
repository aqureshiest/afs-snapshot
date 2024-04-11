import Plugin from "@earnest-labs/microservice-chassis/Plugin.js";
import PluginContext from "@earnest-labs/microservice-chassis/PluginContext.js";
import PlaidClient from "./index.js";
import SensitiveString from "@earnest-labs/ts-sensitivestring";

export const plugin: Plugin<PlaidClient> = {
  name: "plaid",
  version: "1.0.0",
  registerOrder: 0,
  register: async (context: PluginContext) => {
    const plaidClientID = SensitiveString.ExtractValue(
      context.env.PLAID_CLIENT_ID,
    );
    const plaidSecret = SensitiveString.ExtractValue(context.env.PLAID_SECRET);
    const plaidBaseUrl = SensitiveString.ExtractValue(
      context.env.PLAID_BASE_URL,
    );
    if (!plaidClientID || !plaidSecret || !plaidBaseUrl) {
      const error = new Error("[0ebfb927] unable to load Plaid configuration");
      context.logger.error(error);
      throw error;
    }
    const client = new PlaidClient(
      context,
      plaidClientID,
      plaidSecret,
      plaidBaseUrl,
    );

    plugin.instance = client;
  },
};
