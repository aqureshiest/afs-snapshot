import { describe, it, before, mock } from "node:test";
import assert from "node:assert";
import { Request, Response } from "express";

import createPluginContext from "@earnest-labs/microservice-chassis/createPluginContext.js";
import registerChassisPlugins from "@earnest-labs/microservice-chassis/registerChassisPlugins.js";
import readJsonFile from "@earnest-labs/microservice-chassis/readJsonFile.js";
import PluginContext from "@earnest-labs/microservice-chassis/PluginContext.js";
import SensitiveString from "@earnest-labs/ts-sensitivestring";

import executionErrorsMiddleware from "./execution-errors.js";
import createError, { HttpError } from "http-errors";

/* ============================== *
 * TODO: more comprehensive testing for the structure
 * ============================== */

describe("[3efc8e23] API middleware: execution-error", () => {
  let context: PluginContext;

  before(async () => {
    const pkg = await readJsonFile("./package.json");
    pkg.logging = { level: "error" };
    context = await createPluginContext(pkg);
    context.env.NEAS_BASE_URL = "neas-api.earnest.com";
    await registerChassisPlugins(context);
  });

  it("[989e0439] handles generic request failures", async () => {
    const req = {
      method: "POST",
    } as Request;

    const errorKey = "error-key";
    const error = new Error("Unhandled exception");

    const res = {
      locals: {
        manifest: { id: "error" },
        errors: { [errorKey]: [error] },
      },
    } as unknown as Response;

    const next = mock.fn();

    await executionErrorsMiddleware(context, req, res, next);
  });
});
