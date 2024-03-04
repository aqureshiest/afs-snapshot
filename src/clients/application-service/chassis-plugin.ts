import Plugin from "@earnest-labs/microservice-chassis/Plugin.js";
import PluginContext from "@earnest-labs/microservice-chassis/PluginContext.js";
import SensitiveString from "@earnest-labs/ts-sensitivestring";
import getApplicationServiceClientClass from "@earnest/application-service-client/client/index.js";
import BaseClient from "./base-client.js";
import * as typings from "typings/clients/application-service/index.js";

export const plugin: Plugin<typings.ApplicationServiceClient> = {
  name: "applicationServiceClient",
  version: "1.0.0",
  registerOrder: 0,
  register: async (context: PluginContext) => {
    const key = SensitiveString.ExtractValue(context.env.ACCESS_KEY) || "";
    const accessKey = Buffer.from(key).toString("base64");
    const baseUrl =
      SensitiveString.ExtractValue(context.env.APPLICATION_SERVICE_URL) || "";

    const ApplicationServiceClientClass =
      getApplicationServiceClientClass.default(BaseClient);

    const client = new ApplicationServiceClientClass(
      { baseUrl, accessKey },
      context,
    );

    if (context.env.NODE_ENV !== "test") {
      await client.start(context);
    }

    plugin.instance = client;
  },
};
