import { describe, it, before, mock } from "node:test";
import assert from "node:assert";

import createPluginContext from "@earnest-labs/microservice-chassis/createPluginContext.js";
import registerChassisPlugins from "@earnest-labs/microservice-chassis/registerChassisPlugins.js";
import readJsonFile from "@earnest-labs/microservice-chassis/readJsonFile.js";
import AnalyticsServiceClient from "./index.js";
import {
  Context,
  IdentifyParams,
  PageParams,
  TrackParams,
} from "@segment/analytics-node";

describe("[b8dcinbp] Analytics Service Client", () => {
  let context;
  let client: AnalyticsServiceClient;

  before(async () => {
    const pkg = await readJsonFile("./package.json");
    pkg.logging = { level: "error" };

    context = await createPluginContext(pkg);
    await registerChassisPlugins(context);

    client = context.loadedPlugins.analyticsServiceClient.instance;

    mock.method(
      client.client,
      "track",
      async (
        e: TrackParams,
        cb: (err: unknown, ctx: Context | undefined) => void,
      ) => {
        const contx = new Context({ type: "track", ...e });

        await Promise.resolve(cb(null, contx));
      },
    );

    mock.method(
      client.client,
      "identify",
      async (
        e: IdentifyParams,
        cb: (err: unknown, ctx: Context | undefined) => void,
      ) => {
        const contx = new Context({ type: "identify", ...e });

        await Promise.resolve(cb(null, contx));
      },
    );

    mock.method(
      client.client,
      "page",
      async (
        e: PageParams,
        cb: (err: unknown, ctx: Context | undefined) => void,
      ) => {
        const contx = new Context({ type: "page", ...e });

        await Promise.resolve(cb(null, contx));
      },
    );
  });

  describe("[njr43ezv] Segment event tests", () => {
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

      assert.equal(resp, undefined);
    });
    it("[a3y3u5na] Application section started identifying when event given", async () => {
      const props: IdentifyParams = {
        anonymousId: "123",
        traits: {
          section: "Test section",
          product: "SLR",
          product_subtype: "primary-only",
          initiator: "primary",
          role: "primary",
        },
      };
      const resp = await client.identify(props);

      assert.equal(resp, undefined);
    });
    it("[k43080cw] Application section started page when event given", async () => {
      const props: PageParams = {
        anonymousId: "123",
        properties: {
          section: "Test section",
          product: "SLR",
          product_subtype: "primary-only",
          initiator: "primary",
          role: "primary",
        },
      };
      const resp = await client.page(props);

      assert.equal(resp, undefined);
    });
  });
});
