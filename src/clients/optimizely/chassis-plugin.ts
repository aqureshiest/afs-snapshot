import Plugin from "@earnest-labs/microservice-chassis/Plugin.js";
import PluginContext from "@earnest-labs/microservice-chassis/PluginContext.js";
import SensitiveString from "@earnest-labs/ts-sensitivestring";
import OptimizelySDK from "@optimizely/optimizely-sdk";

import OptimizelyClient from "./client.js";

export const plugin: Plugin<OptimizelyClient> = {
  name: "optimizelyClient",
  version: "1.0.0",
  registerOrder: 0,
  register: async (context: PluginContext) => {
    if (!context.env.NODE_TEST_CONTEXT) {
      context.logger.info(
        "Optimizely Plugin in normal mode connecting to Optimizely",
      );
      const key =
        SensitiveString.ExtractRequiredValue(context.env.OPTIMIZELY_SDK_KEY) ||
        "";
      let optimizelySDK;
      try {
        optimizelySDK = OptimizelySDK.createInstance({
          sdkKey: key,
          datafileOptions: {
            autoUpdate: true,
            updateInterval: 60 * 1000 * 10, // 10 minutes
          },
        });

        if (!optimizelySDK) {
          throw new Error(
            "[41901ff1] Failed to create Optimizely SDK instance",
          );
        }
      } catch (error) {
        context.logger.error(error);
        throw error;
      }

      context.logger.info({
        message: "[0725cf6a] waiting for optmizely client",
      });

      const isReady = await optimizelySDK.onReady();

      if (!isReady || !isReady.success) {
        optimizelySDK.close();
        context.logger.warn({
          message: `[2c985bb2] Optimizely Client not ready: ${isReady.reason}`,
        });
      } else {
        context.logger.info({
          message: "[56c8d133] optimizely client ready",
        });
      }
      const client = new OptimizelyClient(context, optimizelySDK);
      plugin.instance = client;
    } else {
      context.logger.info(
        "Optimizely Plugin in Test mode, not connecting to Optimizely",
      );
    }
  },
};
