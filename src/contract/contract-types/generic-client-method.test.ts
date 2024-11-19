import { before, describe, it, mock } from "node:test";
import { Response } from "express";
import assert from "node:assert";

import createPluginContext from "@earnest-labs/microservice-chassis/createPluginContext.js";
import registerChassisPlugins from "@earnest-labs/microservice-chassis/registerChassisPlugins.js";
import readJsonFile from "@earnest-labs/microservice-chassis/readJsonFile.js";

import Contract from "../contract.js";
import Manifest from "../manifest.js";
import { Client } from "@earnest/http";

describe("[4504ed10] Contract: Generice Client Method", () => {
  let context;
  let res;

  before(async () => {
    const pkg = await readJsonFile("./package.json");
    pkg.logging = { level: "error" };
    context = await createPluginContext(pkg);
    await registerChassisPlugins(context);
    res = {} as Response;
  });

  it("[4fc8b002] calls the specified generic client", async () => {
    const MOCKED_RESPONSE = {
      product: "slr",
      rate_map_version: "193",
      rates: [
        {
          rate_low: 4.99,
          rate_high: 9.74,
          rate_type: "fixed",
        },
        {
          rate_low: 5.89,
          rate_high: 9.74,
          rate_type: "variable",
        },
      ],
      effective_date: "2024-07-22T17:23:00+00:00",
    };
    const input = {} as Input<unknown>;

    const manifest = new Manifest(
      "manifestTest",
      {
        "*": "raw",
      },
      {
        raw: {
          default: new Contract({
            key: "genericContract",
            type: "genericRESTRequest",
            raw: JSON.stringify({
              method: "GET",
              uri: "/v1/headline_rates",
              query: {
                product: "slr",
              },
              baseUrl: "http://mountebank:3018",
            }),
          }),
        },
      },
    );

    const result = await manifest.execute(context, input);
    const parsedResult = JSON.parse(JSON.stringify(result));
    assert.deepEqual(parsedResult?.results, MOCKED_RESPONSE);
  });

  it("[dd3acaa1] should return an error", async () => {
    const input = {} as Input<unknown>;

    const manifest = new Manifest(
      "manifestTest",
      {
        "*": "raw",
      },
      {
        raw: {
          default: new Contract({
            key: "genericContract",
            type: "genericRESTRequest",
            raw: JSON.stringify({
              method: "GET",
              uri: "/v1",
              query: {
                product: "slr",
              },
              baseUrl: "http://mountebank:3018",
            }),
          }),
        },
      },
    );

    const result = await manifest.execute(context, input);
    const parsedResult = JSON.parse(JSON.stringify(result));
    assert(parsedResult?.error);
  });
});
