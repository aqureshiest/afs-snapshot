import { before, describe, it, mock } from "node:test";
import assert from "node:assert";
import { Request, Response } from "express";

import createPluginContext from "@earnest-labs/microservice-chassis/createPluginContext.js";
import registerChassisPlugins from "@earnest-labs/microservice-chassis/registerChassisPlugins.js";
import readJsonFile from "@earnest-labs/microservice-chassis/readJsonFile.js";

import getInputs from "./get-inputs.js";
import PluginContext from "@earnest-labs/microservice-chassis/PluginContext.js";

describe("[d7c20b00] get-inputs handler", () => {
  let applicationServiceClient;
  let context;
  let req;

  before(async () => {
    const pkg = await readJsonFile("./package.json");
    pkg.logging = { level: "error" };
    context = await createPluginContext(pkg);
    await registerChassisPlugins(context);
    applicationServiceClient =
      context.loadedPlugins.applicationServiceClient.instance;

    req = {
      method: "POST",
      params: {},
      body: {},
      query: {},
      headers: {},
    };
  });

  it("[2efb6b79] should throw when applicationServiceClient is not instantiated", async () => {
    const res = {
      locals: {
        application: {
          id: 1,
        },
      },
    };
    assert.rejects(
      async () =>
        await getInputs(
          {} as PluginContext,
          req as Request,
          res as unknown as Response,
          () => {},
        ),
      (error: Error) => {
        assert.equal(
          error.message,
          "[67c30fe0] Application Service client instance does not exist",
        );
        return true;
      },
    );
  });

  it("[de80bd37] should throw when a root application is not found", async () => {
    const res = {
      locals: {
        application: {
          id: 1,
        },
      },
    };
    mock.method(applicationServiceClient, "sendRequest", () => {
      return {
        application: null,
      };
    });
    assert.rejects(
      async () =>
        await getInputs(
          context,
          req as Request,
          res as unknown as Response,
          () => {},
        ),
      (error: Error) => {
        assert.equal(
          error.message,
          "[fc867b3a] Root application does not exist",
        );
        return true;
      },
    );
  });

  /**
   * TODO: Remove skip once we add back authorization checks
   */
  it.skip("[f424e58f] should throw if none of the applicants have permissions for the session", async () => {
    const res = {
      locals: {
        application: {
          id: 1,
        },
        auth: {
          session: {
            userId: "1234",
          },
        },
      },
    };
    mock.method(applicationServiceClient, "sendRequest", () => {
      return {
        application: {
          id: 2,
          applicants: [
            {
              id: 1,
              monolithUserID: "5678", // monolithUserID does not match the userId
            },
          ],
        },
      };
    });
    assert.rejects(
      async () =>
        await getInputs(
          context,
          req as Request,
          res as unknown as Response,
          () => {},
        ),
      (error: Error) => {
        assert.equal(
          error.message,
          "[dfbaf766] Unauthorized - applicants lack permissions for this session",
        );
        return true;
      },
    );
  });

  it("[f69befb9] should set the flattened root application on the response object with just a primary", async () => {
    const res = {
      locals: {
        application: {
          id: 1,
        },
        auth: {
          session: {
            userId: "1234",
          },
        },
      },
    };

    mock.method(applicationServiceClient, "sendRequest", () => {
      return {
        application: {
          id: 2,
          applicants: [
            {
              id: 1,
              monolithUserID: "1234",
            },
          ],
        },
      };
    });

    await getInputs(
      context,
      req as Request,
      res as unknown as Response,
      () => {},
    );

    assert.deepEqual(res.locals, {
      application: {
        id: 1,
      },
      auth: {
        session: {
          userId: "1234",
        },
      },
      input: {
        application: {
          id: 2,
          applicants: [
            {
              id: 1,
              monolithUserID: "1234",
            },
          ],
          primary: {
            id: 1,
            monolithUserID: "1234",
          },
        },
        request: {
          ...req,
        },
      },
    });
  });

  it("[87aad0fb] should set the flattened root application on the response object with both a primary and cosigner", async () => {
    const res = {
      locals: {
        application: {
          id: 1,
        },
        auth: {
          session: {
            userId: "1234",
          },
        },
      },
    };

    mock.method(applicationServiceClient, "sendRequest", () => {
      return {
        application: {
          id: 2,
          applicants: [
            {
              id: 1,
              monolithUserID: "1234",
              relationships: [
                {
                  id: 2,
                  relationship: "root",
                },
                {
                  id: 1,
                  relationship: "primary",
                },
              ],
            },
            {
              id: 3,
              monolithUserID: "5678",
              relationships: [
                {
                  id: 2,
                  relationship: "root",
                },
                {
                  id: 3,
                  relationship: "cosigner",
                },
              ],
            },
          ],
        },
      };
    });

    await getInputs(
      context,
      req as Request,
      res as unknown as Response,
      () => {},
    );
    assert.deepEqual(res.locals, {
      application: {
        id: 1,
      },
      auth: {
        session: {
          userId: "1234",
        },
      },
      input: {
        application: {
          id: 2,
          applicants: [
            {
              id: 1,
              monolithUserID: "1234",
              relationships: [
                {
                  id: 2,
                  relationship: "root",
                },
                {
                  id: 1,
                  relationship: "primary",
                },
              ],
            },
            {
              id: 3,
              monolithUserID: "5678",
              relationships: [
                {
                  id: 2,
                  relationship: "root",
                },
                {
                  id: 3,
                  relationship: "cosigner",
                },
              ],
            },
          ],
          primary: {
            id: 1,
            monolithUserID: "1234",
            relationships: [
              {
                id: 2,
                relationship: "root",
              },
              {
                id: 1,
                relationship: "primary",
              },
            ],
          },
          cosigner: {
            id: 3,
            monolithUserID: "5678",
            relationships: [
              {
                id: 2,
                relationship: "root",
              },
              {
                id: 3,
                relationship: "cosigner",
              },
            ],
          },
        },
        request: {
          ...req,
        },
      },
    });
  });
});
