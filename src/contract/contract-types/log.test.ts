import { before, describe, it } from "node:test";
import { Response } from "express";
import assert from "node:assert";

import createPluginContext from "@earnest-labs/microservice-chassis/createPluginContext.js";
import registerChassisPlugins from "@earnest-labs/microservice-chassis/registerChassisPlugins.js";
import readJsonFile from "@earnest-labs/microservice-chassis/readJsonFile.js";

import Contract from "../contract.js";
import Manifest from "../manifest.js";

describe("[0a1e8486] Contract: Log", () => {
  let context;
  let res;

  before(async () => {
    const pkg = await readJsonFile("./package.json");
    pkg.logging = { level: "silly" };
    context = await createPluginContext(pkg);
    await registerChassisPlugins(context);
    res = {} as Response;
  });

  it("[3a35963a] logs exactly once", async (t) => {
    const input = {} as Input;

    const manifest = new Manifest(
      "manifestTest",
      {
        "*": "raw",
      },
      {
        raw: {
          default: new Contract({
            type: "log",
            raw: JSON.stringify({
              message: "test message",
            }),
          }),
        },
      },
    );

    const logFn = t.mock.fn();
    t.mock.method(context.logger, "log", logFn);

    await manifest.execute(context, {}, input);

    assert.equal(logFn.mock.callCount(), 1);
  });
});
