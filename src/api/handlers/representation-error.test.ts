import { describe, it, before, mock } from "node:test";
import assert from "node:assert";
import { Request, Response } from "express";

import createPluginContext from "@earnest-labs/microservice-chassis/createPluginContext.js";
import registerChassisPlugins from "@earnest-labs/microservice-chassis/registerChassisPlugins.js";
import readJsonFile from "@earnest-labs/microservice-chassis/readJsonFile.js";
import PluginContext from "@earnest-labs/microservice-chassis/PluginContext.js";
import SensitiveString from "@earnest-labs/ts-sensitivestring";

import representationErrorMiddleware from "./representation-error.js";
// import createError, { HttpError } from "http-errors";

/* ============================== *
 * TODO: more comprehensive testing for the structure
 * ============================== */

describe("[90d0f479] API middleware: representation-error", () => {
  let context: PluginContext;

  before(async () => {
    const pkg = await readJsonFile("./package.json");
    pkg.logging = { level: "error" };
    context = await createPluginContext(pkg);
    context.env.NEAS_BASE_URL = "neas-api.earnest.com";
    await registerChassisPlugins(context);
  });

  it("[ecffcbd0] handles generic get requests", async () => {
    const req = {
      method: "GET",
    } as Request;

    const res = {
      send: mock.fn(),
      clearCookie: mock.fn(),
      locals: {
        manifest: { id: "error" },
      },
    } as unknown as Response;

    const next = mock.fn();

    const error = new Error("Unhandled exception");

    await representationErrorMiddleware(context, error, req, res, next);
  });
});
