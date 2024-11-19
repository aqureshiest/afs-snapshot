import { before, describe, it, mock } from "node:test";
import { Response } from "express";
import assert from "node:assert";

import createPluginContext from "@earnest-labs/microservice-chassis/createPluginContext.js";
import registerChassisPlugins from "@earnest-labs/microservice-chassis/registerChassisPlugins.js";
import readJsonFile from "@earnest-labs/microservice-chassis/readJsonFile.js";

import Contract from "../contract.js";
import Manifest from "../manifest.js";

describe("[16ced898] Contract: Authenticate", () => {
  let context;
  let res;

  before(async () => {
    const pkg = await readJsonFile("./package.json");
    pkg.logging = { level: "error" };
    context = await createPluginContext(pkg);
    await registerChassisPlugins(context);
    res = {} as Response;
  });

  it("[49d589cf] permits requests when no strategies are specified", async () => {
    const input = { response: res } as Input;
    const manifest = new Manifest(
      "authTest",
      {
        "*": "raw",
      },
      {
        raw: {
          default: new Contract({
            type: "authenticate",
            raw: JSON.stringify({
              mode: "required",
              strategies: [],
            }),
          }),
        },
      },
    );

    const errors = {};

    const result: { [key: string]: unknown } = (
      await manifest.execute(context, { errors }, input)
    ).toJSON() as { [key: string]: unknown };

    assert.notEqual(result?.isValid, false);
    assert.equal(
      Object.keys(errors).length,
      0,
      `Authentication had error(s): ${Object.values(errors).map((err: Error) => err.message)}`,
    );
  });

  it("[19e95cf6] permits valid", async () => {
    const input = { response: res } as Input;
    const manifest = new Manifest(
      "authTest",
      {
        "*": "raw",
      },
      {
        raw: {
          default: new Contract({
            type: "authenticate",
            raw: JSON.stringify({
              strategies: [
                { strategy: "always-valid", isValid: true, isAuthorized: true },
              ],
              method: "GET",
              uri: "/ping",
            }),
          }),
        },
      },
    );

    const errors = {};

    const result: { [key: string]: unknown } = (
      await manifest.execute(context, { errors }, input)
    ).toJSON() as { [key: string]: unknown };

    assert.equal(result?.isValid, true);

    assert.equal(
      Object.keys(errors).length,
      0,
      `Authentication had error(s): ${Object.values(errors).map((err: Error) => err.message)}`,
    );
  });

  it("[19e95cf6] errors invalid", async () => {
    const input = { response: res } as Input;
    const manifest = new Manifest(
      "authTest",
      {
        "*": "raw",
      },
      {
        raw: {
          default: new Contract({
            type: "authenticate",
            raw: JSON.stringify({
              strategies: [{ strategy: "never-valid", isValid: false }],
            }),
          }),
        },
      },
    );

    const errors = {};

    const result: { [key: string]: unknown } = (
      await manifest.execute(context, { errors }, input)
    ).toJSON() as { [key: string]: unknown };

    assert.equal(result?.isValid, false);
    assert.notEqual(
      result.isAuthorized,
      true,
      "Unspecified authorization should not be true",
    );

    assert.notEqual(
      Object.keys(errors).length,
      0,
      `Auth scheme did not produce errors`,
    );
  });

  it("[19e95cf6] errors unauthorized", async () => {
    const input = { response: res } as Input;
    const manifest = new Manifest(
      "authTest",
      {
        "*": "raw",
      },
      {
        raw: {
          default: new Contract({
            type: "authenticate",
            raw: JSON.stringify({
              strategies: [
                {
                  strategy: "valid-but-forbidden",
                  isValid: true,
                  isAuthorized: false,
                },
              ],
            }),
          }),
        },
      },
    );

    const errors = {};

    const result: { [key: string]: unknown } = (
      await manifest.execute(context, { errors }, input)
    ).toJSON() as { [key: string]: unknown };

    assert.equal(result?.isValid, true);
    assert.equal(result?.isAuthorized, false);

    assert.notEqual(
      Object.keys(errors).length,
      0,
      `Auth scheme did not produce errors`,
    );
  });

  it("[19e95cf6] errors invalid and unauthorized", async () => {
    const input = { response: res } as Input;
    const manifest = new Manifest(
      "authTest",
      {
        "*": "raw",
      },
      {
        raw: {
          default: new Contract({
            type: "authenticate",
            raw: JSON.stringify({
              strategies: [
                {
                  strategy: "valid-but-forbidden",
                  isValid: false,
                  isAuthorized: false,
                },
              ],
            }),
          }),
        },
      },
    );

    const errors = {};

    const result: { [key: string]: unknown } = (
      await manifest.execute(context, { errors }, input)
    ).toJSON() as { [key: string]: unknown };

    assert.equal(result?.isValid, false);
    assert.equal(result?.isAuthorized, false);

    assert.notEqual(
      Object.keys(errors).length,
      0,
      `Auth scheme did not produce errors`,
    );
  });
});
