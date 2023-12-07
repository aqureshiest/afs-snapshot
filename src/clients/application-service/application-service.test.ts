import { describe, it, before, mock } from "node:test";
import assert from "node:assert";

import createPluginContext from "@earnest-labs/microservice-chassis/createPluginContext.js";
import registerChassisPlugins from "@earnest-labs/microservice-chassis/registerChassisPlugins.js";
import readJsonFile from "@earnest-labs/microservice-chassis/readJsonFile.js";
import SensitiveString from "@earnest-labs/ts-sensitivestring";

import ApplicationServiceClient from "./index.js";
import { mutationSchemaQuery } from "./graphql.js";

describe("[f8395630] Application Service Client", () => {
  let accessKey;
  let baseUrl;
  let context;
  let client;
  let key;

  before(async () => {
    const pkg = await readJsonFile("./package.json");
    pkg.logging = { level: "error" };

    context = await createPluginContext(pkg);
    await registerChassisPlugins(context);

    key = SensitiveString.ExtractValue(context.env.ACCESS_KEY) || "";
    accessKey = Buffer.from(key).toString("base64");
    baseUrl =
      SensitiveString.ExtractValue(context.env.APPLICATION_SERVICE_URL) || "";

    client = new ApplicationServiceClient(context, accessKey, baseUrl);
  });

  it("[c1ca98f2] should set the mutation schema on start", async () => {
    const schema =  {
      addDetails: {
      details: "AddDetailInput",
      meta: "EventMeta!",
      id: "UUID!",
      },
    };

    mock.method(client, "getSchema", async () => schema);

    await client.start(context, mutationSchemaQuery);
    assert.deepEqual(client.mutationSchema, schema);
  });

  it("[099d3480] should throw an error when requesting a jwt and the response's status code !== 200", async () => {
    mock.method(client, "post", async () => {
      return {
        response: {
          statusCode: 400,
          statusMessage: "Bad Request",
        },
      };
    });

    try {
      await client.requestToken();
    } catch (error) {
      assert.strictEqual(error.message, "Bad Request");
    }
  });

  it("[7a3fc60d] should request a new jwt token", async () => {
    mock.method(client, "post", async () => {
      return {
        results: {
          token: "mock",
        },
        response: {
          statusCode: 200,
        },
      };
    });

    const token = await client.requestToken(context);
    assert.strictEqual(token, "mock");
  });

  it("[84e933d3] should throw an error when requesting a schema and the response's status code !== 200", async () => {
    mock.method(client, "post", async () => {
      return {
        results: {
          errors: [
            {
              message: "Invalid"
            }
          ]
        },
        response: {
          statusCode: 400,
          statusMessage: "Bad Request",
        },
      };
    });

    try {
      await client.getSchema();
    } catch (error) {
      assert.strictEqual(error.message, "Bad Request");
    }
  });

  it("[21aefe81] should get a requested schema", async () => {
    const rawSchema = {
      __type: {
        name: "Mutation",
        fields: [
          {
            name: "addDetails",
            args: [
              {
                name: "details",
                type: {
                  name: "AddDetailInput",
                  kind: "INPUT_OBJECT",
                  ofType: null,
                },
              },
              {
                name: "meta",
                type: {
                  name: null,
                  kind: "NON_NULL",
                  ofType: {
                    name: "EventMeta",
                    kind: "INPUT_OBJECT",
                  },
                },
              },
              {
                name: "id",
                type: {
                  name: null,
                  kind: "NON_NULL",
                  ofType: {
                    name: "UUID",
                    kind: "SCALAR",
                  },
                },
              },
            ],
          },
        ],
      },
    };

    mock.method(client, "post", async () => {
      return {
        results: {
          data: rawSchema,
        },
        response: {
          statusCode: 200,
        },
      };
    });

    const schema = await client.getSchema(context, mutationSchemaQuery);
    assert.deepEqual(schema, {
      addDetails: {
        details: "AddDetailInput",
        meta: "EventMeta!",
        id: "UUID!",
      },
    });
  });

  it("[362464a8] should generate fields for graphql queries and mutations", () => {
    const fields = client.generateFields([
      "id",
      "createdAt",
      "deletedAt",
      "name.first",
      "income.type",
      "application.cosigner.id",
    ]);

    assert.strictEqual(
      fields,
      "id,createdAt,deletedAt,name { first },income { type },application { cosigner { id } },",
    );
  });

  it("[af5648c0] should process variables for graphql queries and mutations", async () => {
    const data = {
      details: {
        name: {
          first: "first",
          last: "last",
        },
      },
      meta: {
        service: "apply-flow-service",
      },
    };

    const types = {
      details: "AddDetailInput",
      meta: "EventMeta!",
      id: "UUID!",
    };

    const variables = client.processVariables(data, types);
    assert.deepEqual(variables, {
      details: {
        value: { name: { first: "first", last: "last" } },
        type: "AddDetailInput",
      },
      meta: { value: { service: "apply-flow-service" }, type: "EventMeta!" },
    });
  });

  it("[5186a333] should throw an error when querying an application and the response's status code !== 200", async () => {
    mock.method(client, "post", async () => {
      return {
        results: {
          errors: [
            {
              message: "Invalid"
            }
          ]
        },
        response: {
          statusCode: 400,
          statusMessage: "Bad Request",
        },
      };
    });

    try {
      await client.getApplication(context, "1", ["id", "application.id"]);
    } catch (error) {
      assert.strictEqual(error.message, "Bad Request");
    }
  });

  it("[02658f67] should get an application", async () => {
    mock.method(client, "post", async () => {
      return {
        results: {
          data: {
            application: {
              id: "1",
            },
          },
        },
        response: {
          statusCode: 200,
        },
      };
    });

    const application = await client.getApplication(context, "1");
    assert.deepEqual(application, { id: "1" });
  });

  it("[eff7363c] should throw an error when performing a mutation and the response's status code !== 200", async () => {
    client.mutationSchema = {
      createApplication: {
        relationships: "[RelationshipInput]",
        meta: "EventMeta!",
      },
    };

    mock.method(client, "post", async () => {
      return {
        results: {
          errors: [
            {
              message: "Invalid"
            }
          ]
        },
        response: {
          statusCode: 400,
          statusMessage: "Bad Request",
        },
      };
    });

    try {
      await client.mutate(context, "createApplication", {
        fields: ["id", "application.id"],
        meta: { service: "apply-flow-service" },
      });
    } catch (error) {
      assert.strictEqual(error.message, "Bad Request");
    }
  });

  it("[9559590f] should perform a graphql mutation", async () => {
    client.mutationSchema = {
      createApplication: {
        relationships: "[RelationshipInput]",
        meta: "EventMeta!",
      },
    };

    mock.method(client, "getToken", async () => {
      return "token";
    });

    mock.method(client, "post", async () => {
      return {
        results: {
          data: {
            createApplication: {
              id: "1",
              application: {
                id: "2",
              },
            },
          },
        },
        response: {
          statusCode: 200,
        },
      };
    });

    const mutation = await client.mutate(context, "createApplication", {
      fields: ["id", "application.id"],
      meta: { service: "apply-flow-service" },
    });
    assert.deepEqual(mutation, {
      createApplication: {
        id: "1",
        application: {
          id: "2",
        },
      },
    });
  });

  it("[b4636504] should perform a graphql query", async () => {
    const expectedResult = {
      id: "1",
      createdAt: "2023-11-29T23:11:43.214Z",
      deletedAt: null,
      events: [
        {
          event: "addReferences",
          id: "2",
          data: {
            meta: {
              service: "apply-flow-service",
            },
            references: [
              {
                referenceId: "01da1d1c-af2b-4cc9-9dca-cc839337bf59",
                referenceType: "cognitoId",
              },
              {
                referenceId: "1cd0476c-940b-4e4a-9c2e-18b364fe29c0",
                referenceType: "product",
              },
              {
                referenceId: "c03edbe8-088e-4221-89ba-3c0b8b5c3d24",
                referenceType: "monolithUserId",
              },
            ],
          },
        },
      ],
    };

    mock.method(client, "getToken", async () => {
      return "token";
    });

    mock.method(client, "post", async () => {
      return {
        results: {
          data: {
            application: {
              ...expectedResult,
            },
          },
        },
        response: {
          statusCode: 200,
        },
      };
    });

    const queryResponse = await client.query(context, "application", {
      id: "1",
      fields: [
        "id",
        "createdAt",
        "deletedAt",
        "events.event",
        "events.id",
        "events.data",
      ],
    });
    assert.deepEqual(queryResponse, { application: expectedResult });
  });

  it("[87a54c7d] should throw an error when performing a query", async () => {
    mock.method(client, "post", async () => {
      return {
        results: {
          errors: [
            {
              message: "Invalid"
            }
          ]
        },
        response: {
          statusCode: 400,
          statusMessage: "Bad Request",
        },
      };
    });

    try {
      await client.query(context, "application", { id: "1" });
    } catch (error) {
      assert.strictEqual(error.message, "Bad Request");
    }
  });
});
