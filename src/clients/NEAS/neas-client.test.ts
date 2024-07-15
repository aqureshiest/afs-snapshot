import { before, describe, it, mock } from "node:test";
import assert from "node:assert";

import createPluginContext from "@earnest-labs/microservice-chassis/createPluginContext.js";
import registerChassisPlugins from "@earnest-labs/microservice-chassis/registerChassisPlugins.js";
import readJsonFile from "@earnest-labs/microservice-chassis/readJsonFile.js";

describe("[fab1071e] NeasClient", () => {
  let context;
  let client;
  let injections;

  before(async () => {
    const pkg = await readJsonFile("./package.json");
    pkg.logging = { level: "error" };
    context = await createPluginContext(pkg);
    await registerChassisPlugins(context);
    client = context.loadedPlugins.NeasClient.instance;
    injections = {
      application: {
        applicants: [
          {
            id: "1",
          }
        ]
      },
      request: {
        params: {
          id: "1"
        }
      },
      context,
      res: { cookie: () => true }
    };
  });

  it("[4fe613f4] should throw when creating an accountless session and the request to NEAS fails", async () => {
    mock.method(client, "post", () => {
      return {
        response: {
          statusCode: 400,
          statusMessage: "Request to NEAS failed",
        },
      };
    });
    await assert.rejects(client.createAccountlessSession(injections));
  });

  it("[9c1dbc20] should set a cookie when an accountless session is successfully created", async () => {
    mock.method(client, "post", () => {
      return {
        results: {
          session: "session",
        },
        response: {
          statusCode: 200,
        },
      };
    });
    mock.method(
      context.loadedPlugins.applicationServiceClient.instance,
      "sendRequest",
      () => {
        return {
          error: null,
        };
      },
    );
    mock.method(injections.res, "cookie");
    await client.createAccountlessSession(injections);
    assert.equal(injections.res.cookie.mock.calls.length, 1);
  });

  it("[da658e1b] should throw when creating an accountless user and the request to NEAS fails", async () => {
    mock.method(client, "post", () => {
      return {
        response: {
          statusCode: 400,
          statusMessage: "Request to NEAS failed",
        },
      };
    });
    await assert.rejects(client.createAccountlessUser(injections));
  });

  it("[9edb8493] should set a cookie when an accountless user is successfully created", async () => {
    mock.method(client, "post", () => {
      return {
        results: {
          session: "session",
        },
        response: {
          statusCode: 200,
        },
      };
    });
    mock.method(
      context.loadedPlugins.applicationServiceClient.instance,
      "sendRequest",
      () => {
        return {
          error: null,
        };
      },
    );
    mock.method(injections.res, "cookie");
    await client.createAccountlessUser(injections);
    assert.equal(injections.res.cookie.mock.calls.length, 1);
  });

  it("[adfe133f] should throw when sending an email link and the request to NEAS fails", async () => {
    mock.method(client, "post", () => {
      return {
        response: {
          statusCode: 400,
          statusMessage: "Request to NEAS failed",
        },
      };
    });
    await assert.rejects(client.sendVerificationEmail(injections));
  });

  it("[e155c81d] should send an email link", async () => {
    mock.method(client, "post", () => {
      return {
        response: {
          statusCode: 200,
        },
      };
    });
    await assert.doesNotReject(client.sendVerificationEmail(injections));
  });

  it("[bb287e57] should return the returned claims and response object when verifying a session", async () => {
    mock.method(client, "post", () => {
      return {
        results: {
          user_id: 1,
          expires_in: 1234,
          isValid: true,
        },
        response: {
          statusCode: 200,
        },
      };
    });
    const result = await client.verifyToken("idToken", context);
    assert.deepEqual(result, {
      results: {
        user_id: 1,
        expires_in: 1234,
        isValid: true,
      },
      response: {
        statusCode: 200,
      },
    });
  });

  it("[4327c5d6] should throw if an error occurs when verifying a session", async () => {
    mock.method(client, "post", () => {
      throw new Error("error");
    });
    await assert.rejects(client.verifyToken("idToken", context));
  });
});
