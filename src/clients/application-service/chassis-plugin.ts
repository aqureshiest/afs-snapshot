import Plugin from "@earnest-labs/microservice-chassis/Plugin.js";
import PluginContext from "@earnest-labs/microservice-chassis/PluginContext.js";
import ApplicationServiceClient from "./index.js";
import SensitiveString from "@earnest-labs/ts-sensitivestring";
import { mutationSchema } from "./graphql.js";

export const plugin: Plugin<ApplicationServiceClient> = {
  name: "applicationServiceClient",
  version: "1.0.0",
  registerOrder: 0,
  register: async (context: PluginContext ) => {
    const key = SensitiveString.ExtractValue(context.env.ACCESS_KEY) || "";
    const accessKey = Buffer.from(key).toString("base64")
    const baseUrl = context.env.APPLICATION_SERVICE_URL as string;

    const client = new ApplicationServiceClient(accessKey, baseUrl);

    const schemaReponse = await client.getSchema(mutationSchema);

    const processedSchema = client.processSchema(schemaReponse.__type.fields);

    client.mutationSchema = processedSchema;

    console.log("4f4f2363 schema", processedSchema);

    const mutationResponse = client.mutate("createApplication", ["id", "application.id"], { relationships: null, meta: { service: "test" } });

    plugin.instance = client;
  },
};
