import { describe, it, before, mock, afterEach } from "node:test";
import assert from "assert";
import OptimizelySDK from "@optimizely/optimizely-sdk";
import PluginContext from "@earnest-labs/microservice-chassis/PluginContext.js";
import readJsonFile from "@earnest-labs/microservice-chassis/readJsonFile.js";
import createPluginContext from "@earnest-labs/microservice-chassis/createPluginContext.js";
import OptimizelyClient, { FeatureFlagKey } from "./client.js";

describe("[0defb22a] OptimizelyClient", () => {
  let context: PluginContext;
  let optimizelyClient: OptimizelyClient;

  before(async () => {
    const pkg = await readJsonFile("./package.json");
    pkg.logging = { level: "error" };

    context = await createPluginContext(pkg);
  });

  describe("[fc0b691d] getFeatureFlag", () => {
    afterEach(() => {
      mock.restoreAll();
    });

    it("[18dd7551] cis_person flag should return true if feature flag is enabled", async () => {
      optimizelyClient = new OptimizelyClient(context, {
        isFeatureEnabled: () => true,
      } as unknown as OptimizelySDK.Client);
      const result = await optimizelyClient.getFeatureFlag(
        FeatureFlagKey.CIS_PERSON,
      );
      assert.strictEqual(result, true);
    });

    it("[8d465a5b] cis_person should return false if feature flag is not enabled", async () => {
      optimizelyClient = new OptimizelyClient(context, {
        isFeatureEnabled: () => false,
      } as unknown as OptimizelySDK.Client);

      const result = await optimizelyClient.getFeatureFlag(
        FeatureFlagKey.CIS_PERSON,
      );
      assert.strictEqual(result, false);
    });

    it("[6bc01db3] cis_person should log and throw an error if something goes wrong", async () => {
      const error = new Error("Test error");
      optimizelyClient = new OptimizelyClient(context, {
        isFeatureEnabled: () => {
          throw error;
        },
      } as unknown as OptimizelySDK.Client);
      await assert.rejects(
        async () =>
          await optimizelyClient.getFeatureFlag(FeatureFlagKey.CIS_PERSON),
        error,
      );
    });

    it("[4caa4f81] Return true if multiple feature flags are enabled", async () => {
      optimizelyClient = new OptimizelyClient(context, {
        isFeatureEnabled: () => true,
      } as unknown as OptimizelySDK.Client);
      const result = await optimizelyClient.getFeatureFlags({
        flags: [FeatureFlagKey.CIS_PERSON],
      });

      assert.deepEqual(result, { [FeatureFlagKey.CIS_PERSON]: true });
    });
  });
});
