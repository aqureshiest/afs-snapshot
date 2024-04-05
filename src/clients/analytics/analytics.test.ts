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
  let analyticsServiceClient: AnalyticsServiceClient;

  before(async () => {
    const pkg = await readJsonFile("./package.json");
    pkg.logging = { level: "error" };

    context = await createPluginContext(pkg);
    await registerChassisPlugins(context);

    analyticsServiceClient =
      context.loadedPlugins.analyticsServiceClient.instance;
  });

  describe("[njr43ezv] Segment event tests", () => {
    it("[5lke3jnn] Application section started tracking when event given", async () => {
      const mockTrackFn = mock.fn(
        async (
          e: TrackParams,
          cb: (err: unknown, ctx: Context | undefined) => void
        ) => {
          const contx = new Context({ type: "track", ...e });

          await Promise.resolve(cb(null, contx));
        }
      );

      mock.method(analyticsServiceClient.segmentClient, "track", mockTrackFn);

      const props: TrackParams = {
        userId: "123",
        event: "Test event",
        properties: {
          applicationId: "123",
          section: "Test section",
          product: "SLR",
          loan_type: "independent",
          source: "application",
          step: "test step",
        },
      };
      await analyticsServiceClient.track(props);

      assert.strictEqual(mockTrackFn.mock.calls.length, 1);
    });
    it("[a3y3u5na] Application section started identifying when event given", async () => {
      const mockIdentifyFn = mock.fn(
        async (
          e: IdentifyParams,
          cb: (err: unknown, ctx: Context | undefined) => void
        ) => {
          const contx = new Context({ type: "identify", ...e });

          await Promise.resolve(cb(null, contx));
        }
      );

      mock.method(
        analyticsServiceClient.segmentClient,
        "identify",
        mockIdentifyFn
      );
      const props: IdentifyParams = {
        userId: "123",
        traits: {
          applicationId: "123",
          product: "SLR",
        },
      };
      await analyticsServiceClient.identify(props);

      assert.strictEqual(mockIdentifyFn.mock.calls.length, 1);
    });
    it("[k43080cw] Application section started page when event given", async () => {
      const mockPageFn = mock.fn(
        async (
          e: PageParams,
          cb: (err: unknown, ctx: Context | undefined) => void
        ) => {
          const contx = new Context({ type: "page", ...e });

          await Promise.resolve(cb(null, contx));
        }
      );

      mock.method(analyticsServiceClient.segmentClient, "page", mockPageFn);
      const props: PageParams = {
        userId: "123",
        name: "test page",
        properties: {
          applicationId: "123",
          product: "SLR",
          source: "application",
        },
      };
      await analyticsServiceClient.page(props);

      assert.strictEqual(mockPageFn.mock.calls.length, 1);
    });
  });
});
