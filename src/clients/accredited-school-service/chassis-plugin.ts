import Plugin from "@earnest-labs/microservice-chassis/Plugin.js";
import PluginContext from "@earnest-labs/microservice-chassis/PluginContext.js";
import AccreditedSchoolServiceClient from "./index.js";
import SensitiveString from "@earnest-labs/ts-sensitivestring";

export const plugin: Plugin<AccreditedSchoolServiceClient> = {
  name: "accreditedSchoolService",
  version: "1.0.0",
  registerOrder: 0,
  register: async (context: PluginContext) => {
    const baseUrl =
      SensitiveString.ExtractValue(
        context.env.ACCREDITED_SCHOOL_SERVICE_BASEURL,
      ) || "";

    const client = new AccreditedSchoolServiceClient(context, baseUrl);

    plugin.instance = client;
  },
};
