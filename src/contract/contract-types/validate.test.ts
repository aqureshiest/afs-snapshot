import { before, describe, it } from "node:test";
import { Response } from "express";
import assert from "node:assert";

import createPluginContext from "@earnest-labs/microservice-chassis/createPluginContext.js";
import registerChassisPlugins from "@earnest-labs/microservice-chassis/registerChassisPlugins.js";
import readJsonFile from "@earnest-labs/microservice-chassis/readJsonFile.js";

import Contract from "../contract.js";
import Manifest from "../manifest.js";

describe("[f6b2c5e3] Contract: Validate", () => {
  let context;

  before(async () => {
    const pkg = await readJsonFile("./package.json");
    pkg.logging = { level: "silly" };
    context = await createPluginContext(pkg);
    await registerChassisPlugins(context);
  });

  const TEST_SCHEMA = {
    type: "object",
    required: ["required"],
    properties: {
      required: {
        type: "boolean",
      },
      optional: {
        type: ["boolean", "number", "string", "null"],
      },
    },
  };

  describe("[97508748] positive cases", () => {
    it("[9a8412cf] validates", async (t) => {
      const input = {} as Input;

      const manifest = new Manifest(
        "manifestTest",
        {
          "*": "raw",
        },
        {
          raw: {
            default: new Contract({
              type: "validate",
              raw: JSON.stringify({
                schema: TEST_SCHEMA,
                payload: { required: true },
              }),
            }),
          },
        },
      );

      const result = (await manifest.execute(context, input)).toJSON() as {
        isValid: true;
      };
      assert.equal(
        result.isValid,
        true,
        "Result did not include isValid: true",
      );
    });
  });

  describe("[b5b9a31d] negative cases", () => {
    it("[47e1f21b] provides errors", async (t) => {
      const input = {} as Input;

      const manifest = new Manifest(
        "manifestTest",
        {
          "*": "raw",
        },
        {
          raw: {
            default: new Contract({
              type: "validate",
              raw: JSON.stringify({
                schema: TEST_SCHEMA,
                payload: { optional: true },
              }),
            }),
          },
        },
      );

      const result = (await manifest.execute(context, input)).toJSON() as {
        isValid: true;
      };
      assert.equal(
        result.isValid,
        false,
        "Result did not include isValid: false",
      );
    });

    it("[88b719e7] triggers evaluation errors (if specified)", async (t) => {
      const input = {} as Input;

      const manifest = new Manifest(
        "manifestTest",
        {
          "*": "raw",
        },
        {
          raw: {
            default: new Contract({
              type: "validate",
              raw: JSON.stringify({
                schema: TEST_SCHEMA,
                onError: true,
                payload: { optional: true },
              }),
            }),
          },
        },
      );

      const instance = await manifest.execute(context, input);
      const result = instance.toJSON();

      assert.notEqual(
        Object.keys(instance.errors).length,
        0,
        "The errors object did not contain any errors",
      );
    });
  });
});
