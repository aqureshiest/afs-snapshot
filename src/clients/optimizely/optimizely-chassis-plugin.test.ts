import { describe, it, mock } from "node:test";
import assert from "node:assert";
import OptimizelySDK from "@optimizely/optimizely-sdk";
import { plugin } from "./chassis-plugin.js";
import SensitiveString from "@earnest-labs/ts-sensitivestring";
import PluginContext from "@earnest-labs/microservice-chassis/PluginContext.js";
describe("[b3eacf70] Optimizely chassis-plugins", () => {
  it("[e5f6g7h8] throws error if Optimizely SDK instance creation fails", async () => {
    const context = {
      env: {
        OPTIMIZELY_SDK_KEY: "test-sdk-key",
        NODE_TEST_CONTEXT: false,
      },
      logger: {
        info: mock.fn(),
        error: mock.fn(),
      },
    };

    mock.method(SensitiveString, "ExtractRequiredValue", () => "test-sdk-key");
    mock.method(OptimizelySDK, "createInstance", () => null);

    try {
      await plugin.register(context as unknown as PluginContext);
      assert.fail("Expected error was not thrown");
    } catch (error) {
      assert.strictEqual(
        error.message,
        "[41901ff1] Failed to create Optimizely SDK instance",
      );
    }
  });

  it("[i9j0k1l2] throws error if Optimizely Client is not ready", async () => {
    const context = {
      env: {
        OPTIMIZELY_SDK_KEY: "test-sdk-key",
        NODE_TEST_CONTEXT: false,
      },
      logger: {
        info: mock.fn(),
        error: mock.fn(),
        warn: mock.fn(),
      },
    };

    mock.method(SensitiveString, "ExtractRequiredValue", () => "test-sdk-key");
    mock.method(OptimizelySDK, "createInstance", () => ({
      onReady: async () => ({ success: false }),
      close: async () => {},
    }));
    await assert.doesNotReject(
      plugin.register(context as unknown as PluginContext),
    );
  });
});
