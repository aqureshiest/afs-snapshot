import Plugin from "@earnest-labs/microservice-chassis/Plugin.js";
import PluginContext from "@earnest-labs/microservice-chassis/PluginContext.js";
import ApplicationServiceClient from "./application-service.js";
import SensitiveString from "@earnest-labs/ts-sensitivestring";

export const plugin: Plugin = {
  name: "applicationServiceClient",
  version: "1.0.0",
  registerOrder: 0,
  register: async (context: PluginContext ) => {
    const key = SensitiveString.ExtractValue(context.env.ACCESS_KEY) || "";
    const accessKey = Buffer.from(key).toString("base64")

    const client = new ApplicationServiceClient(accessKey);

    const schemaReponse = await client.getSchema();

    const processedSchema = client.processSchema(schemaReponse.__type.fields);

    client.mutationSchema = processedSchema;

    const mutationResponse = client.mutate("createApplication", ["id", "application.id"], { relationships: null, meta: { service: "test" } });
  },
};
