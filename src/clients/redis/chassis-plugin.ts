import Plugin from "@earnest-labs/microservice-chassis/Plugin.js";
import PluginContext from "@earnest-labs/microservice-chassis/PluginContext.js";

import RedisClient from "./index.js";

export const plugin: Plugin<RedisClient> = {
  name: "redis",
  version: "1.0.0",
  registerOrder: 0,
  register: async (context: PluginContext) => {
    if (!context.env.NODE_TEST_CONTEXT) {
      context.logger.info("Redis Plugin in normal mode connecting to Redis");
      const client = new RedisClient(context);
      try {
        await client.connect(context);
      } catch (ex) {
        context.logger.error(ex);
        throw ex;
      }
      process.on("SIGTERM", () => {
        client.disconnect();
      });
      plugin.instance = client;
    } else {
      context.logger.info("Redis Plugin in Test mode, not connecting to Redis");
    }
  },
};
