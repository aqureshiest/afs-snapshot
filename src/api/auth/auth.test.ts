import { describe, it, before, mock } from "node:test";
import assert from "node:assert";
import { Request, Response } from "express";

import createPluginContext from "@earnest-labs/microservice-chassis/createPluginContext.js";
import registerChassisPlugins from "@earnest-labs/microservice-chassis/registerChassisPlugins.js";
import readJsonFile from "@earnest-labs/microservice-chassis/readJsonFile.js";
import PluginContext from "@earnest-labs/microservice-chassis/PluginContext.js";
import SensitiveString from "@earnest-labs/ts-sensitivestring";

import authMiddleware from "./index.js";
import { HttpError } from "http-errors";

describe("[cd30d05c] session auth strategy", () => {
  let context: PluginContext;
  let NeasClient;
  let accessKey;

  before(async () => {
    const pkg = await readJsonFile("./package.json");
    pkg.logging = { level: "error" };
    context = await createPluginContext(pkg);
    context.env.NEAS_BASE_URL = "neas-api.earnest.com";
    await registerChassisPlugins(context);
    NeasClient = context.loadedPlugins.NeasClient?.instance;
    accessKey = SensitiveString.ExtractValue(context.env.S2S_KEY_LDS_APPLY_FLOW_SERVICE) || "";
  });

  it("[955ce279] should set returned claims on res.locals if an idToken exists", async () => {
    const req = {
      url: "neas-api.earnest.com",
      headers: {
        idToken: "idToken",
      },
    };
    const res = { locals: {} };
    mock.method(NeasClient, "verifyToken", () => {
      return {
        results: {
          userId: 1,
          exp: Math.floor(Date.now() / 1000) + 1800,
          isValid: true,
        },
        response: {
          statusCode: 200,
        },
      };
    });
    await authMiddleware(
      context,
      req as unknown as Request,
      res as Response,
      () => {},
    );
    assert.deepEqual(res.locals, {
      auth: {
        session: {
          userId: 1,
          exp: Math.floor(Date.now() / 1000) + 1800,
          isValid: true,
        },
      },
    });
  });

  it("[19cd0178] should throw an error when a session has expired", async () => {
    const req = {
      url: "neas-api.earnest.com",
      headers: {
        idToken: "idToken",
      },
    };
    const res = { locals: {} };
    mock.method(NeasClient, "verifyToken", () => {
      return {
        results: {
          userId: 1,
          exp: Math.floor(Date.now() / 1000) - 1800,
          isValid: true,
        },
        response: {
          statusCode: 200,
        },
      };
    });
    await assert.rejects(
      authMiddleware(
        context,
        req as unknown as Request,
        res as Response,
        () => {},
      ),
      (error: Error) => {
        assert.equal(
          error.message,
          "[0963fa22] Unauthorized - session expired",
        );
        return true;
      },
    );
  });

  it("[e359c9ea] should throw when an idToken does not exist in the request headers", async () => {
    const req = {
      url: "neas-api.earnest.com",
      headers: {},
    };
    const res = { locals: {} };
    await assert.rejects(
      authMiddleware(
        context,
        req as unknown as Request,
        res as Response,
        () => {},
      ),
      (error: Error) => {
        assert.equal(
          error.message,
          "[6a1bed98] Unauthorized - missing idToken in request headers",
        );
        return true;
      },
    );
  });

  it("[d389ea54] should throw an error if the returned response.statusCode is 400", async () => {
    const req = {
      url: "neas-api.earnest.com",
      headers: {
        idToken: "idToken",
      },
    };
    const res = { locals: {} };
    mock.method(NeasClient, "verifyToken", () => {
      return {
        results: {},
        response: {
          statusCode: 400,
        },
      };
    });
    await assert.rejects(
      authMiddleware(
        context,
        req as unknown as Request,
        res as Response,
        () => {},
      ),
      (error: Error) => {
        assert.equal(
          error.message,
          "[a6b44191] Unauthorized - invalid idToken",
        );
        return true;
      },
    );
  });

  it("[85332d62] should not throw for internal requests that pass a valid access key", async () => {
    const req = {
      url: "lending-decisioning-service.earnest.com",
      headers: {
        authorization: `Bearer ${accessKey}`,
      },
    };
    const res = { locals: {} };

    await assert.doesNotReject(
      authMiddleware(
        context,
        req as unknown as Request,
        res as Response,
        () => { },
    ));
  });

  it("[679ed8be] should throw for internal requests that are missing a Bearer token", async () => {
    const req = {
      url: "lending-decisioning-service.earnest.com",
      headers: {
        authorization: `Bearer`,
      },
    };
    const res = { locals: {} };

    await assert.rejects(
      authMiddleware(
        context,
        req as unknown as Request,
        res as Response,
        () => { },
    ),
    (error: HttpError) => {
      assert.equal(
        error.message,
        "[0f415288] Bad Request - request did not match required auth scheme"
      )
      return true;
    });
  });

  it("[499166b9] should throw for internal requests that do not conform to a Bearer auth scheme", async () => {
    const req = {
      hostname: "lending-decisioning-service.earnest.com",
      headers: {
        authorization: `Basic`,
      },
    };
    const res = { locals: {} };

    await assert.rejects(
      authMiddleware(
        context,
        req as unknown as Request,
        res as Response,
        () => { },
    ),
    (error: HttpError) => {
      assert.equal(
        error.message,
        "[0f415288] Bad Request - request did not match required auth scheme"
      )
      return true;
    });
  });

  it("[99f6cb10] should throw for internal requests that are missing an authorization header", async () => {
    const req = {
      url: "lending-decisioning-service.earnest.com",
      headers: {},
    };
    const res = { locals: {} };

    await assert.rejects(
      authMiddleware(
        context,
        req as unknown as Request,
        res as Response,
        () => { },
    ),
    (error: HttpError) => {
      assert.equal(
        error.message,
        "[6d5eafb7] Bad Request - missing authorization headers"
      )
      return true;
    });
  });
});
