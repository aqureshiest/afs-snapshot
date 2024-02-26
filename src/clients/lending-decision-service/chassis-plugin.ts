import Plugin from "@earnest-labs/microservice-chassis/Plugin.js";
import PluginContext from "@earnest-labs/microservice-chassis/PluginContext.js";
import LendingDecisionServiceClient from "./index.js";
import SensitiveString from "@earnest-labs/ts-sensitivestring";

export const plugin: Plugin<LendingDecisionServiceClient> = {
  name: "lendingDecisionServiceClient",
  version: "1.0.0",
  registerOrder: 0,
  register: async (context: PluginContext) => {
    const key =
      SensitiveString.ExtractValue(
        context.env.S2S_KEY_LDS_APPLY_FLOW_SERVICE,
      ) || "";
    const accessKey = Buffer.from(key).toString("base64");
    const baseUrl =
      SensitiveString.ExtractValue(context.env.LENDING_DECISION_SERVICE_URL) ||
      "";

    const client = new LendingDecisionServiceClient(
      context,
      accessKey,
      baseUrl,
    );

    plugin.instance = client;
  },
};
