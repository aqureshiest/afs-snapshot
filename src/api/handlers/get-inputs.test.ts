import { before, describe, it, mock } from "node:test";
import assert from "node:assert";
import { Request, Response } from "express";

import createPluginContext from "@earnest-labs/microservice-chassis/createPluginContext.js";
import registerChassisPlugins from "@earnest-labs/microservice-chassis/registerChassisPlugins.js";
import readJsonFile from "@earnest-labs/microservice-chassis/readJsonFile.js";

import getInputs from "./get-inputs.js";
import PluginContext from "@earnest-labs/microservice-chassis/PluginContext.js";

describe("[d7c20b00] get-inputs handler", () => {
  let context;
  let req;

  before(async () => {
    const pkg = await readJsonFile("./package.json");
    pkg.logging = { level: "error" };
    context = await createPluginContext(pkg);
    await registerChassisPlugins(context);

    req = {
      method: "POST",
      params: {},
      body: {},
      query: {},
      headers: {},
    };
  });

  it("[2efb6b79] should throw when applicationServiceClient is not instantiated", async () => {
    assert.rejects(
      async () =>
        await getInputs(
          {} as PluginContext,
          req as Request,
          {} as Response,
          () => {},
        ),
    );
  });

  it("[f8e4e7f3] should set res.locals.input to the queried application when a root application does not exist", async () => {
    const res = {
      locals: {
        application: {
          id: 1,
        },
      },
    };

    mock.method(
      context.loadedPlugins.applicationServiceClient.instance,
      "sendRequest",
      () => {
        return {
          application: {
            id: 1,
          },
        };
      },
    );

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
      input: {
        application: {
          id: 1,
        },
        request: {
          ...req,
        },
      },
    });
  });

  it("[f69befb9] should set the flattened root application on the response object with just a primary", async () => {
    const res = {
      locals: {
        application: {
          id: 1,
        },
      },
    };
    // initial request to fetch an application
    mock.method(
      context.loadedPlugins.applicationServiceClient.instance,
      "sendRequest",
      () => {
        return {
          application: {
            id: 2,
            root: {
              id: 1,
              primary: null,
            },
          },
        };
      },
    );
    // second request to fetch the root application and its applicants
    mock.method(
      context.loadedPlugins.applicationServiceClient.instance,
      "sendRequest",
      () => {
        return {
          application: {
            id: 1,
            applicants: [
              {
                id: 2,
              },
            ],
          },
        };
      },
    );

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
      input: {
        application: {
          id: 1,
          applicants: [
            {
              id: 2,
            },
          ],
          primary: {
            id: 2,
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
      },
    };
    // initial request to fetch an application
    mock.method(
      context.loadedPlugins.applicationServiceClient.instance,
      "sendRequest",
      () => {
        return {
          application: {
            id: 2,
            root: {
              id: 1,
              primary: null,
              cosigner: null,
            },
          },
        };
      },
    );
    // second request to fetch the root application and its applicants
    mock.method(
      context.loadedPlugins.applicationServiceClient.instance,
      "sendRequest",
      () => {
        return {
          application: {
            id: 1,
            applicants: [
              {
                id: 2,
                relationships: [
                  {
                    id: 1,
                    relationship: "root",
                  },
                  {
                    id: 2,
                    relationship: "primary",
                  },
                ],
              },
              {
                id: 3,
                relationships: [
                  {
                    id: 1,
                    relationship: "root",
                  },
                  {
                    id: 3,
                    relationship: "cosigner",
                  },
                ],
              },
            ],
            primary: null,
            cosigner: null,
          },
        };
      },
    );

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
      input: {
        application: {
          id: 1,
          applicants: [
            {
              id: 2,
              relationships: [
                {
                  id: 1,
                  relationship: "root",
                },
                {
                  id: 2,
                  relationship: "primary",
                },
              ],
            },
            {
              id: 3,
              relationships: [
                {
                  id: 1,
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
            id: 2,
            relationships: [
              {
                id: 1,
                relationship: "root",
              },
              {
                id: 2,
                relationship: "primary",
              },
            ],
          },
          cosigner: {
            id: 3,
            relationships: [
              {
                id: 1,
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

  it("[7c2a5843] should not throw when the a request to application service fails", async () => {
    const res = {
      locals: {
        application: {
          id: 1,
        },
      },
    };

    mock.method(
      context.loadedPlugins.applicationServiceClient.instance,
      "sendRequest",
      () => {
        throw new Error("request failed")
      });

    assert.doesNotReject(async () => { await getInputs(context, req as Request, res as unknown as Response, () => { }) });
  });
});
