import ingestManifests from "./ingestor.js";
import execute from "./contract-executor.js";

export const plugin: Plugin = {
  name: "contractExecution",
  version: "1.0.0",
  registerOrder: 0,
  register: async (context: Context) => {
    const { contracts, manifests } = await ingestManifests(context);
    
    plugin.instance = { execute, contracts, manifests };
  },
};
