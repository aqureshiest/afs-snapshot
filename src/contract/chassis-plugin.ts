import ingestManifests from "./ingestor.js";

import Manifest from "./manifest.js";
import Contract from "./contract.js";

export const plugin: Plugin = {
  name: "contractExecution",
  version: "1.0.0",
  registerOrder: 0,
  register: async (context: Context) => {
    const { contracts, manifests } = await ingestManifests(context);

    plugin.instance = { Contract, contracts, Manifest, manifests };
  },
};
