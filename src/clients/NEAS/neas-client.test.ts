import { before, describe, it, mock } from "node:test";
import assert from "node:assert";

import createPluginContext from "@earnest-labs/microservice-chassis/createPluginContext.js";
import registerChassisPlugins from "@earnest-labs/microservice-chassis/registerChassisPlugins.js";
import readJsonFile from "@earnest-labs/microservice-chassis/readJsonFile.js";

describe("[fab1071e] NeasClient", () => {
  let context;
  let client

  before(async () => {
    const pkg = await readJsonFile("./package.json");
    pkg.logging = { level: "error" };
    context = await createPluginContext(pkg);
    await registerChassisPlugins(context);
    client = context.loadedPlugins.NeasClient.instance;
  });

  it("[d14f4e15] should throw when creating a guest id and application-service-client is not instantiated", async () => {
    assert.rejects(
      async () =>  await client.createGuestId("1",
      { loadedPlugins:
        { applicationServiceClient: 
          { 
            instance: null 
          }
        } 
      }),
    );
  });

  it("[4fe613f4] should throw when creating a guest id and the request to NEAS fails", async () => {
    mock.method(client, "post", () => {
      return {
        response: {
          statusCode: 400,
          statusMessage: "Request to NEAS failed"
        }
      }
    });
    assert.rejects(async () =>  await client.createGuestId("1", context));
  });

  it("[cac09811] should throw when creating a guest id and an error is returned when creating an identityId reference", async () => {
    mock.method(client, "post", () => {
      return {
        results: {
          identityId: "2",
          session: "session"
        },
        response: {
          statusCode: 200
        }
      }
    });
    mock.method(context.loadedPlugins.applicationServiceClient.instance, "sendRequest", () => {
      return {
        error: "Bad request"
      }
    });
    assert.rejects(async () =>  await client.createGuestId("1", context));
  });

  it("[9c1dbc20] should set the session on headers['set-cookies'] and return the response", async () => {
    const response = {
      statusCode: 200,
      headers: {
        "set-cookie": []
      }
    };
    mock.method(client, "post", () => {
      return {
        results: {
          identityId: "2",
          session: "session"
        },
        response
      }
    });
    mock.method(context.loadedPlugins.applicationServiceClient.instance, "sendRequest", () => {
      return {
        error: null
      }
    });
    const result = await client.createGuestId("1", context);
    assert.deepStrictEqual(result.headers["set-cookie"], ["session"]);
  });

  it("[fdf93ed5] should throw when creating an auth id and application-service-client is not instantiated", () => {
    assert.rejects(
      async () =>  await client.createAuthId("1", "sessionId",
      { loadedPlugins:
        { applicationServiceClient: 
          { 
            instance: null 
          }
        } 
      }),
    ); 
  });

  it("[9ca88af8] should throw when creating an auth id and an application does not exist", () => {
    mock.method(context.loadedPlugins.applicationServiceClient.instance, "sendRequest", () => {
      return {
        application: null
      }
    });
    assert.rejects(async () =>  await client.createAuthId("1", "sessionId", context)); 
  });

  it("[c5178513] should throw when creating an auth id and an email detail doest not exist", () => {
    mock.method(context.loadedPlugins.applicationServiceClient.instance, "sendRequest", () => {
      return {
        application: {
          details: {
            email: null
          }
        }
      }
    });
    assert.rejects(async () =>  await client.createAuthId("1", context)); 
  });

  it("[da658e1b] should throw when creating an auth id and the request to NEAS fails", () => {
    mock.method(context.loadedPlugins.applicationServiceClient.instance, "sendRequest", () => {
      return {
        application: {
          details: {
            email: "test@earnest.com"
          }
        }
      }
    });
    mock.method(client, "post", () => {
      return {
        response: {
          statusCode: 400,
          statusMessage: "Request to NEAS failed"
        }
      }
    });
    assert.rejects(async () =>  await client.createAuthId("1", "sessionId", context)); 
  });

  it("[99416084] should throw when creating an auth id and an error is returned when creating an authId reference", () => {
    mock.method(client, "post", () => {
      return {
        results: {
          authId: "2",
          session: "session"
        },
        response: {
          statusCode: 200,
          statusMessage: "Request to NEAS failed"
        }
      }
    });
    mock.method(context.loadedPlugins.applicationServiceClient.instance, "sendRequest", () => {
      return {
        application: {
          details: {
            email: "test@earnest.com"
          }
        },
        error: "Bad request"
      }
    });
    assert.rejects(async () =>  await client.createAuthId("1", "sessionId", context)); 
  });

  it("[3f51d326] should set the session on headers['set-cookies'] and return the response", async () => {
    const response = {
      statusCode: 200,
      headers: {
        "set-cookie": []
      }
    };
    mock.method(client, "post", () => {
      return {
        results: {
          identityId: "2",
          session: "session"
        },
        response
      }
    });
    mock.method(context.loadedPlugins.applicationServiceClient.instance, "sendRequest", () => {
      return {
        application: {
          details: {
            email: "test@earnest.com"
          }
        },
        error: null
      }
    });
    const result = await client.createAuthId("1", "sessionId", context);
    assert.deepStrictEqual(result.headers["set-cookie"], ["session"]);
  });

  it("[e3f0638e] should throw when sending an email link and application-service-client is not instantiated", async () => {
    assert.rejects(
      async () =>  await client.sendEmailLink("1", "sessionId",
      { loadedPlugins:
        { applicationServiceClient: 
          { 
            instance: null 
          }
        } 
      }),
    );
  });

  it("[358d4b58] should throw when sending an email link and and an authID detail does not exist", () => {
    mock.method(context.loadedPlugins.applicationServiceClient.instance, "sendRequest", () => {
      return {
        application: {
          authID: null,
          details: {
            email: "test@earnest.com"
          }
        }
      }
    });
    assert.rejects(async () =>  await client.sendEmailLink("1", "sessionId", context)); 
  });

  it("[da760e33] should throw when sending an email link and and an email detail does not exist", () => {
    mock.method(context.loadedPlugins.applicationServiceClient.instance, "sendRequest", () => {
      return {
        application: {
          authID: "1",
          details: {
            email: null
          }
        }
      }
    });
    assert.rejects(async () =>  await client.sendEmailLink("1", "sessionId", context)); 
  });

  it("[adfe133f] should throw when sending an email link and the request to NEAS fails", () => {
    mock.method(context.loadedPlugins.applicationServiceClient.instance, "sendRequest", () => {
      return {
        application: {
          authID: "1",
          details: {
            email: "test@earnest.com"
          }
        }
      }
    });
    mock.method(client, "post", () => {
      return {
        response: {
          statusCode: 400,
          statusMessage: "Request to NEAS failed"
        }
      }
    });
    assert.rejects(async () =>  await client.sendEmailLink("1", "sessionId", context)); 
  });

  it("[e155c81d] should send an email link", () => {
    mock.method(context.loadedPlugins.applicationServiceClient.instance, "sendRequest", () => {
      return {
        application: {
          authID: "1",
          details: {
            email: "test@earnest.com"
          }
        }
      }
    });
    mock.method(client, "post", () => {
      return {
        response: {
          statusCode: 200,
        }
      }
    });
    assert.doesNotReject(async () =>  await client.sendEmailLink("1", "sessionId", context)); 
  });
});
