import { describe, it, before, mock } from "node:test";
import assert from "node:assert";

import createPluginContext from "@earnest-labs/microservice-chassis/createPluginContext.js";
import registerChassisPlugins from "@earnest-labs/microservice-chassis/registerChassisPlugins.js";
import readJsonFile from "@earnest-labs/microservice-chassis/readJsonFile.js";
import AnalyticsServiceClient from "./index.js";
import { TrackParams } from "@segment/analytics-node";

describe("[b8dcinbp] Analytics Service Client", () => {
  let context;
  let client: AnalyticsServiceClient;

  before(async () => {
    const pkg = await readJsonFile("./package.json");
    pkg.logging = { level: "error" };

    context = await createPluginContext(pkg);
    await registerChassisPlugins(context);

    client = context.loadedPlugins.analyticsServiceClient.instance;

    mock.method(client, "track", async () => {
      return true;
    });
  });

  describe("[yk8kus13] Track event tests", () => {
    it("[5lke3jnn] Application section started tracking when event given", async () => {
      const props: TrackParams = {
        anonymousId: "123",
        event: "Test event",
        properties: {
          section: "Test section",
          product: "SLR",
          product_subtype: "primary-only",
          initiator: "primary",
          role: "primary",
        },
      };
      const resp = await client.track(props);

      assert.equal(resp, true);
    });
  });
});
