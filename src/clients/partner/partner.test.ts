import { describe, it, before, mock } from "node:test";
import assert from "node:assert";

import createPluginContext from "@earnest-labs/microservice-chassis/createPluginContext.js";
import registerChassisPlugins from "@earnest-labs/microservice-chassis/registerChassisPlugins.js";
import readJsonFile from "@earnest-labs/microservice-chassis/readJsonFile.js";
import PartnerClient from "./index.js";

describe("[b8dcinbp] Partner Client", () => {
  let context;
  let partnerClient: PartnerClient;

  before(async () => {
    const pkg = await readJsonFile("./package.json");
    pkg.logging = { level: "error" };

    context = await createPluginContext(pkg);
    await registerChassisPlugins(context);

    partnerClient = context.loadedPlugins.partnerClient.instance;
  });

  describe("[cee3d1zv] Attribution event tests", () => {
    it("[5lke3jnn] Saves attribution event", async () => {
      const mockFn = mock.fn((context, event, props) => {
        return {
          error: null,
        };
      });

      mock.method(
        partnerClient, // The object instance
        "saveAttributionEvent", // The method name to mock
        mockFn, // The actual mock function
      );
      const props = {
        user_id: "12345",
        application_id: "54321",
        // source, referral_codes and device_id may be made required in the handler,
        // depending on the value of attributionEventPath
        device_id: "aeiou",
      };
      await partnerClient.saveAttributionEvent(context, "SLR_QS", props);
      assert.equal(mockFn.mock.calls.length, 1);
    });
  });
});
