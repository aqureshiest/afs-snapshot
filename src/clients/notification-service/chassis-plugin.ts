import Plugin from "@earnest-labs/microservice-chassis/Plugin.js";
import PluginContext from "@earnest-labs/microservice-chassis/PluginContext.js";
import NotificationServiceClient from "./index.js";
import SensitiveString from "@earnest-labs/ts-sensitivestring";

export const plugin: Plugin<NotificationServiceClient> = {
  name: "notificationServiceClient",
  version: "1.0.0",
  registerOrder: 0,
  register: async (context: PluginContext) => {
    const accessKey =
      SensitiveString.ExtractValue(
        context.env.S2S_KEY_AFS_NOTIFICATION_SERVICE,
      ) || "";
    const baseUrl =
      SensitiveString.ExtractValue(context.env.NOTIFICATION_SERVICE_BASE_URL) ||
      "";
    const client = new NotificationServiceClient(accessKey, baseUrl);

    plugin.instance = client;
  },
};
