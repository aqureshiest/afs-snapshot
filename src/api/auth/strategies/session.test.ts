import { describe, it, before, mock } from "node:test";
import assert from "node:assert";
import { Request, Response } from "express";

import createPluginContext from "@earnest-labs/microservice-chassis/createPluginContext.js";
import registerChassisPlugins from "@earnest-labs/microservice-chassis/registerChassisPlugins.js";
import readJsonFile from "@earnest-labs/microservice-chassis/readJsonFile.js";
import PluginContext from "@earnest-labs/microservice-chassis/PluginContext.js";

import authMiddleware from "../index.js";

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

  it("[955ce279] should set returned claims on res.locals if an idToken exists", async () => {
    const req = {
      headers: {
        idToken: "idToken"
      }
    };
    const res = { locals: {} }
    mock.method(NeasClient, "verifySession", () => {
      return {
        results: {
          userId: 1,
          exp: Math.floor(Date.now() / 1000) + 1800,
          isValid: true,
        },
        response: {
          statusCode: 200,
        }
      }
    });
    await authMiddleware(context, req as unknown as Request, res as Response, () => { });
    assert.deepEqual(res.locals, {
      auth: {
        session: {
          userId: 1,
          exp: Math.floor(Date.now() / 1000) + 1800,
          isValid: true,
        }
      }
    });
  });

  it("[19cd0178] should throw an error when a session has expired", async () => {
    const req = {
      headers: {
        idToken: "idToken"
      }
    };
    const res = { locals: {} }
    mock.method(NeasClient, "verifySession", () => {
      return {
        results: {
          userId: 1,
          exp: Math.floor(Date.now() / 1000) - 1800,
          isValid: true,
        },
        response: {
          statusCode: 200,
        }
      }
    });
    assert.rejects(
      async () => await authMiddleware(context, req as unknown as Request, res as Response, () => { }),
      (error: Error) => {
        assert.equal(error.message, "[0963fa22] Unauthorized - session expired");
        return true;
      },
    )
  });

  it("[e359c9ea] should throw when an idToken does not exist in the request headers", async () => {
    const req = {
      headers: {}
    };
    const res = { locals: {} }
    assert.rejects(
      async () => await authMiddleware(context, req as unknown as Request, res as Response, () => { }),
      (error: Error) => {
        assert.equal(error.message, "[6a1bed98] Unauthorized - missing idToken in request headers");
        return true;
      },
    )
  });

  it("[d389ea54] should throw an error if the returned response.statusCode is 400", async () => {
    const req = {
      headers: {
        idToken: "idToken"
      }
    };
    const res = { locals: {} }
    mock.method(NeasClient, "verifySession", () => {
      return {
        results: {},
        response: {
          statusCode: 400,
        }
      }
    });
    assert.rejects(
      async () => await authMiddleware(context, req as unknown as Request, res as Response, () => { }),
      (error: Error) => {
        assert.equal(error.message, "[a6b44191] Unauthorized - invalid session");
        return true;
      },
    );
  });
});
