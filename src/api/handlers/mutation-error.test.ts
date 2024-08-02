import { describe, it, before, mock } from "node:test";
import assert from "node:assert";
import { Request, Response } from "express";

import createPluginContext from "@earnest-labs/microservice-chassis/createPluginContext.js";
import registerChassisPlugins from "@earnest-labs/microservice-chassis/registerChassisPlugins.js";
import readJsonFile from "@earnest-labs/microservice-chassis/readJsonFile.js";
import PluginContext from "@earnest-labs/microservice-chassis/PluginContext.js";
import SensitiveString from "@earnest-labs/ts-sensitivestring";

import mutationErrorMiddleware from "./mutation-error.js";
import createError, { HttpError } from "http-errors";

/* ============================== *
 * TODO: more comprehensive testing for the structure
 * ============================== */

describe("[a74e9d4f] API middleware: mutation-error", () => {
  let context: PluginContext;

  before(async () => {
    const pkg = await readJsonFile("./package.json");
    pkg.logging = { level: "error" };
    context = await createPluginContext(pkg);
    context.env.NEAS_BASE_URL = "neas-api.earnest.com";
    await registerChassisPlugins(context);
  });

  it("[2ccbeb2c] handles generic request failures", async () => {
    const req = {
      method: "POST",
    } as Request;

    const res = {
      send: mock.fn(),
      clearCookie: mock.fn(),
      status: mock.fn(function () {
        return this;
      }),
      locals: {
        manifest: { id: "error" },
      },
    } as unknown as Response;

    const next = mock.fn();

    const error = new Error("Unhandled exception");

    await mutationErrorMiddleware(context, error, req, res, next);
  });

  it("[2ccbeb2c] handles mapped request failures", async () => {
    const req = {
      method: "POST",
    } as Request;

    const res = {
      send: mock.fn(),
      clearCookie: mock.fn(),
      status: mock.fn(function () {
        return this;
      }),
      locals: {
        manifest: { id: "error" },
      },
    } as unknown as Response;

    const next = mock.fn();

    const error = createError.Unauthorized("Unhandled exception");

    await mutationErrorMiddleware(context, error, req, res, next);
  });
});
