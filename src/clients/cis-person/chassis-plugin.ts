import Plugin from "@earnest-labs/microservice-chassis/Plugin.js";
import PluginContext from "@earnest-labs/microservice-chassis/PluginContext.js";
import CisPersonClient from "./client.js";
import SensitiveString from "@earnest-labs/ts-sensitivestring";

export const plugin: Plugin<CisPersonClient> = {
  name: "cisPersonClient",
  version: "1.0.0",
  registerOrder: 0,
  register: async (context: PluginContext) => {
    const { WSM_CIS_GET_ENDPOINT, CIS_PERSON_KEY, CIS_PERSON_CERT } =
      context.env;

    const privateKey = SensitiveString.ExtractValue(CIS_PERSON_KEY) || "";
    const key = Buffer.from(privateKey, "utf8");

    const certificate = SensitiveString.ExtractValue(CIS_PERSON_CERT) || "";
    const cert = Buffer.from(certificate, "utf8");

    const getPersonWSDL = SensitiveString.ExtractValue(WSM_CIS_GET_ENDPOINT);
    if (!getPersonWSDL) {
      throw new Error(`[31ced08d] getPersonWSDL not found`);
    }

    plugin.instance = new CisPersonClient(getPersonWSDL, key, cert);
  },
};
