import SensitiveString from "@earnest-labs/ts-sensitivestring";

import InternalRestServiceClient from "./client.js";

export const plugin: Plugin = {
  name: "internalRestServiceClient",
  version: "1.0.0",
  registerOrder: 0,
  register: async (context: Context) => {
    const baseUrl =
      SensitiveString.ExtractValue(
        context.env.INTERNAL_REST_SERVICE_BASE_URL,
      ) || "";

    const authKey =
      SensitiveString.ExtractValue(
        context.env.INTERNAL_REST_SERVICE_AUTH_KEY,
      ) || "";

    const client = new InternalRestServiceClient({
      baseUrl,
      authKey,
    });

    if (!context.env.NODE_TEST_CONTEXT) {
      await client.start(context);
      process.on("SIGTERM", () => client.stop());
    }

    plugin.instance = client;
  },
};
