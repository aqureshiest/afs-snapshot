import { before, describe, it, mock } from "node:test";
import assert from "node:assert";

import createPluginContext from "@earnest-labs/microservice-chassis/createPluginContext.js";
import registerChassisPlugins from "@earnest-labs/microservice-chassis/registerChassisPlugins.js";
import readJsonFile from "@earnest-labs/microservice-chassis/readJsonFile.js";

describe("[fab1071e] NeasClient", () => {
  let context;
  let client;

  before(async () => {
    const pkg = await readJsonFile("./package.json");
    pkg.logging = { level: "error" };
    context = await createPluginContext(pkg);
    await registerChassisPlugins(context);
    client = context.loadedPlugins.NeasClient.instance;
  });

  it("[d14f4e15] should throw when creating an unauthenticated identity and application-service-client is not instantiated", async () => {
    assert.rejects(
      async () =>
        await client.createUnauthenticatedIdentity("1", {
          loadedPlugins: {
            applicationServiceClient: {
              instance: null,
            },
          },
        }),
    );
  });

  it("[4fe613f4] should throw when creating an unauthenticated identity and the request to NEAS fails", async () => {
    mock.method(client, "post", () => {
      return {
        response: {
          statusCode: 400,
          statusMessage: "Request to NEAS failed",
        },
      };
    });
    assert.rejects(
      async () => await client.createUnauthenticatedIdentity("1", context),
    );
  });

  it("[cac09811] should throw when creating an unauthenticated identity and an error is returned when creating an identityId reference", async () => {
    mock.method(client, "post", () => {
      return {
        results: {
          authId: "2",
          sessionToken: "session",
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
          error: "Bad request",
        };
      },
    );
    assert.rejects(
      async () => await client.createUnauthenticatedIdentity("1", context),
    );
  });

  it("[9c1dbc20] should return a session token", async () => {
    mock.method(client, "post", () => {
      return {
        results: {
          authId: "2",
          sessionToken: "session",
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
    const result = await client.createUnauthenticatedIdentity("1", context);
    assert.equal(result, "session");
  });

  it("[fdf93ed5] should throw when creating an auth id and application-service-client is not instantiated", () => {
    assert.rejects(
      async () =>
        await client.createAuthId("1", "token", {
          loadedPlugins: {
            applicationServiceClient: {
              instance: null,
            },
          },
        }),
    );
  });

  it("[9ca88af8] should throw when creating an auth id and an application does not exist", () => {
    mock.method(
      context.loadedPlugins.applicationServiceClient.instance,
      "sendRequest",
      () => {
        return {
          application: null,
        };
      },
    );
    assert.rejects(
      async () => await client.createAuthId("1", "token", context),
    );
  });

  it("[c5178513] should throw when creating an auth id and an email detail doest not exist", () => {
    mock.method(
      context.loadedPlugins.applicationServiceClient.instance,
      "sendRequest",
      () => {
        return {
          application: {
            details: {
              email: null,
            },
          },
        };
      },
    );
    assert.rejects(
      async () => await client.createAuthId("1", "token", context),
    );
  });

  it("[da658e1b] should throw when creating an auth id and the request to NEAS fails", () => {
    mock.method(
      context.loadedPlugins.applicationServiceClient.instance,
      "sendRequest",
      () => {
        return {
          application: {
            details: {
              email: "test@earnest.com",
            },
          },
        };
      },
    );
    mock.method(client, "post", () => {
      return {
        response: {
          statusCode: 400,
          statusMessage: "Request to NEAS failed",
        },
      };
    });
    assert.rejects(
      async () => await client.createAuthId("1", "token", context),
    );
  });

  it("[99416084] should throw when creating an auth id and an error is returned when creating an authId reference", () => {
    mock.method(client, "post", () => {
      return {
        results: {
          authId: "2",
          sessionToken: "session",
        },
        response: {
          statusCode: 200,
          statusMessage: "Request to NEAS failed",
        },
      };
    });
    mock.method(
      context.loadedPlugins.applicationServiceClient.instance,
      "sendRequest",
      () => {
        return {
          application: {
            details: {
              email: "test@earnest.com",
            },
          },
          error: "Bad request",
        };
      },
    );
    assert.rejects(
      async () => await client.createAuthId("1", "token", context),
    );
  });

  it("[3f51d326] should return a new session token", async () => {
    mock.method(client, "post", () => {
      return {
        results: {
          authId: "2",
          sessionToken: "session",
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
          application: {
            details: {
              email: "test@earnest.com",
            },
          },
          error: null,
        };
      },
    );
    const result = await client.createAuthId("1", "token", context);
    assert.equal(result, "session");
  });

  it("[e3f0638e] should throw when sending an email link and application-service-client is not instantiated", async () => {
    assert.rejects(
      async () =>
        await client.sendEmailLink("1", "sessionId", {
          loadedPlugins: {
            applicationServiceClient: {
              instance: null,
            },
          },
        }),
    );
  });

  it("[358d4b58] should throw when sending an email link and and an authID detail does not exist", () => {
    mock.method(
      context.loadedPlugins.applicationServiceClient.instance,
      "sendRequest",
      () => {
        return {
          application: {
            authID: null,
            details: {
              email: "test@earnest.com",
            },
          },
        };
      },
    );
    assert.rejects(
      async () => await client.sendEmailLink("1", "token", context),
    );
  });

  it("[da760e33] should throw when sending an email link and an email detail does not exist", () => {
    mock.method(
      context.loadedPlugins.applicationServiceClient.instance,
      "sendRequest",
      () => {
        return {
          application: {
            authID: "1",
            details: {
              email: null,
            },
          },
        };
      },
    );
    assert.rejects(
      async () => await client.sendEmailLink("1", "token", context),
    );
  });

  it("[adfe133f] should throw when sending an email link and the request to NEAS fails", () => {
    mock.method(
      context.loadedPlugins.applicationServiceClient.instance,
      "sendRequest",
      () => {
        return {
          application: {
            authID: "1",
            details: {
              email: "test@earnest.com",
            },
          },
        };
      },
    );
    mock.method(client, "post", () => {
      return {
        response: {
          statusCode: 400,
          statusMessage: "Request to NEAS failed",
        },
      };
    });
    assert.rejects(
      async () => await client.sendEmailLink("1", "token", context),
    );
  });

  it("[e155c81d] should send an email link", () => {
    mock.method(
      context.loadedPlugins.applicationServiceClient.instance,
      "sendRequest",
      () => {
        return {
          application: {
            authID: "1",
            details: {
              email: "test@earnest.com",
            },
          },
        };
      },
    );
    mock.method(client, "post", () => {
      return {
        response: {
          statusCode: 200,
        },
      };
    });
    assert.doesNotReject(
      async () => await client.sendEmailLink("1", "token", context),
    );
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
    assert.rejects(async () => await client.verifyToken("idToken", context));
  });
});
