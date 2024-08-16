import Plugin from "@earnest-labs/microservice-chassis/Plugin.js";
import PluginContext from "@earnest-labs/microservice-chassis/PluginContext.js";
import CalculatorServiceClient from "./index.js";
import SensitiveString from "@earnest-labs/ts-sensitivestring";

export const plugin: Plugin<CalculatorServiceClient> = {
  name: "calculatorServiceClient",
  version: "1.0.0",
  registerOrder: 0,
  register: async (context: PluginContext) => {
    const accessKey =
      SensitiveString.ExtractValue(
        context.env.S2S_KEY_AFS_CALCULATOR_SERVICE,
      ) || "";
    const baseUrl =
      SensitiveString.ExtractValue(context.env.CALCULATOR_SERVICE_URL) || "";

    const client = new CalculatorServiceClient(accessKey, baseUrl);

    plugin.instance = client;
  },
};
