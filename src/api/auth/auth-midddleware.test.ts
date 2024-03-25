import { describe, it, before, mock } from "node:test";
import assert from "node:assert";
import { Request, Response } from "express";

import createPluginContext from "@earnest-labs/microservice-chassis/createPluginContext.js";
import registerChassisPlugins from "@earnest-labs/microservice-chassis/registerChassisPlugins.js";
import readJsonFile from "@earnest-labs/microservice-chassis/readJsonFile.js";
import PluginContext from "@earnest-labs/microservice-chassis/PluginContext.js";

import authMiddleware from "./index.js";

describe("[cd30d05c] session auth strategy", () => {
  let context: PluginContext;
  let NeasClient;

  before(async () => {
    const pkg = await readJsonFile("./package.json");
    pkg.logging = { level: "error" };
    context = await createPluginContext(pkg);
    await registerChassisPlugins(context);
    NeasClient = context.loadedPlugins.NeasClient?.instance;
  });

  it("[955ce279] should return set returned claims if a session token exists", async () => {
    const req = {
      cookies: {
        session: "session"
      }
    };
    const res = { locals: {} }
    mock.method(NeasClient, "getAuthStatus", () => {
      return {
        user_id: 1,
        expires_in: 1234
      }
    });
    await authMiddleware(context, req as unknown as Request, res as Response, () => { })
    assert.deepEqual(res.locals, {
      auth: {
        session: {
          user_id: 1,
          expires_in: 1234,
        }
      }
    });
  });

  it("[d389ea54] should not set any claims if the request to getAuthStatus returns undefined", async () => {
    const req = {
      cookies: {
        session: "session"
      }
    };
    const res = { locals: {} }
    mock.method(NeasClient, "getAuthStatus", () => {
      return undefined
    });
    await authMiddleware(context, req as unknown as Request, res as Response, () => { })
    assert.deepEqual(res.locals, { auth: { }});
  });
});
