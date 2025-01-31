import { before, describe, it, mock } from "node:test";
import { Response } from "express";
import assert from "node:assert";

import createPluginContext from "@earnest-labs/microservice-chassis/createPluginContext.js";
import registerChassisPlugins from "@earnest-labs/microservice-chassis/registerChassisPlugins.js";
import readJsonFile from "@earnest-labs/microservice-chassis/readJsonFile.js";
import Input from "contract/contract-types/optimizely-method.js";
import Contract from "../contract.js";
import Manifest from "../manifest.js";
import OptimizelySDK from "@optimizely/optimizely-sdk";
import SensitiveString from "@earnest-labs/ts-sensitivestring";

describe("[a36f60ef] Contract: OptimizelyMethod", () => {
  let context;
  let res;

  before(async () => {
    const pkg = await readJsonFile("./package.json");
    pkg.logging = { level: "error" };
    context = await createPluginContext(pkg);
    await registerChassisPlugins(context);
    res = {} as Response;
  });

  it("[e37c6f34] calls the specified client", async () => {
    // const MOCKED_RESPONSE = {
    //   cis_person: true
    // };
    mock.method(OptimizelySDK, "createInstance", () => ({
      onReady: async () => ({ success: true }),
      close: async () => {},
      isFeatureEnabled: () => true,
    }));
    const modifiedContext = {
      ...context,
      env: {
        ...context.env,
        OPTIMIZELY_SDK_KEY: "test-sdk-key",
        NODE_TEST_CONTEXT: false,
      },
      loadedPlugins: {
        optimizelyClient: {
          instance: OptimizelySDK.createInstance({
            sdkKey: "test-sdk-key",
            datafileOptions: {
              autoUpdate: true,
              updateInterval: 60 * 1000 * 10, // 10 minutes
            },
          }),
        },
      },
    };

    mock.method(SensitiveString, "ExtractRequiredValue", () => "test-sdk-key");
    const input = {} as Input;
    const manifest = new Manifest(
      "manifestTest",
      {
        "*": "raw",
      },
      {
        raw: {
          default: new Contract({
            type: "optimizelyMethod",
            raw: JSON.stringify({
              optimizelyMethod: "getFeatureFlags",
              userId: "783a3ee0",
              featureFlagKeys: "{flags: ['cis_person']}",
            }),
          }),
        },
      },
    );
    const result = await manifest.execute(modifiedContext, input);
    assert(result);
  });
});
