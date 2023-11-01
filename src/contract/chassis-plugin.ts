import ingestManifests from "./ingestor.js";

export const plugin: Plugin = {
  name: "contractExecution",
  version: "1.0.0",
  register: async (context: Context) => {
    const { contracts, manifests } = await ingestManifests(context);

    plugin.instance = { contracts, manifests };
  },
};
