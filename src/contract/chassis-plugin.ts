/* eslint-disable @typescript-eslint/no-unused-vars */
import * as path from "node:path";
import * as fs from "node:fs";
import ingestManifests from "./ingestor.js";

import Manifest from "./manifest.js";
import Contract from "./contract.js";

const FLOWS_PATH = path.join("flows");

export const plugin: Plugin = {
  name: "contractExecution",
  version: "1.0.0",
  registerOrder: 0,
  register: async (context: Context) => {
    const { contracts, manifests } = await ingestManifests(context);

    const useWatcher =
      context.env.APP_ENV === "development" && !context.env.NODE_TEST_CONTEXT;

    if (useWatcher) {
      context.logger.info("Using contract file watcher");

      const watcher = fs.watch(
        FLOWS_PATH,
        { recursive: true },
        async (eventType, filename) => {
          const {
            contracts: replacementContracts,
            manifests: replacementManifests,
          } = await ingestManifests(context);

          plugin.instance = {
            Contract,
            contracts: replacementContracts,
            Manifest,
            manifests: replacementManifests,
          };
        },
      );

      process.on("SIGTERM", () => {
        watcher.close();
      });
    }

    plugin.instance = { Contract, contracts, Manifest, manifests };
  },
};
