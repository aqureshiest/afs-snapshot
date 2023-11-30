import { describe, it, before, after, mock } from "node:test";
import assert from "node:assert";

import { plugin as knexPlugin } from "@earnest-labs/microservice-chassis-knex/knex.chassis-plugin.js";
import createPluginContext from "@earnest-labs/microservice-chassis/createPluginContext.js";
import registerChassisPlugins from "@earnest-labs/microservice-chassis/registerChassisPlugins.js";
import readJsonFile from "@earnest-labs/microservice-chassis/readJsonFile.js";
import SensitiveString from "@earnest-labs/ts-sensitivestring";

import ApplicationServiceClient from "./index.js";
import { mutationSchema } from "./graphql.js";

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

    client = new ApplicationServiceClient(accessKey, baseUrl);
  });

  after(async () => {
    const knex = knexPlugin.connections.get("DEFAULT");
    if (knex) knex.destroy();
  });

  it("[099d3480] should throw an error when requesting a jwt and the response's status code is >= 400", async () => {
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
      assert(error.message, "Bad Request");
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
    assert(token, "mock");
  });

  it("[84e933d3] should throw an error when requesting a schema and the response's status code !== 200", async () => {
    mock.method(client, "post", async () => {
      return {
        response: {
          statusCode: 400,
          statusMessage: "Bad Request",
        },
      };
    });

    try {
      await client.getSchema();
    } catch (error) {
      assert(error.message, "Bad Request");
    }
  });

  it("[21aefe81] should get a requested schema", async () => {
    const schemaResponse = {
      __type: {
        name: "mock",
        fields: [
          {
            name: "field",
            args: [
              {
                name: "arg",
                type: {
                  name: "type",
                  kind: "kind",
                  ofType: null,
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
          data: schemaResponse,
        },
        response: {
          statusCode: 200,
        },
      };
    });

    const schema = await client.getSchema(mutationSchema);
    assert.deepEqual(schema, schemaResponse);
  });

  it("[9f04b0f0] should process a given schema", async () => {
    const schema = {
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

    const processedSchema = client.processSchema(schema.__type.fields);
    assert.deepEqual(processedSchema, {
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
    ]);

    assert(fields, "id,createdAt,deletedAt,name { first }, income { type },");
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

  it("[eff7363c] should throw an error when performing a mutation and the response's status code !== 200", async () => {
    client.mutationSchema = {
      createApplication: {
        relationships: "[RelationshipInput]",
        meta: "EventMeta!",
      },
    };

    mock.method(client, "post", async () => {
      return {
        response: {
          statusCode: 400,
          statusMessage: "Bad Request",
        },
      };
    });

    try {
      await client.mutate("createApplication", ["id", "application.id"], {
        relationships: null,
        meta: { service: "apply-flow-service" },
      });
    } catch (error) {
      assert(error.message, "Bad Request");
    }
  });

  it("[9559590f] should perform a graphql mutation", async () => {
    client.mutationSchema = {
      createApplication: {
        relationships: "[RelationshipInput]",
        meta: "EventMeta!",
      },
    };

    const req = {
      params: {
        uuid: 1,
      },
      body: {
        event: "createApplication",
        fields: ["id", "application.id"],
        data: {
          relationships: null,
          meta: {
            service: "apply-flow-service",
          },
        },
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

    const mutation = await client.mutate(context, req);
    assert.deepEqual(mutation, {
      createApplication: {
        id: "1",
        application: {
          id: "2",
        },
      },
    });
  });

  it("[b4636504] perform a graphql query", async () => {
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

    const req = {
      params: {
        uuid: 1,
      },
      body: {
        fields: [
          "id",
          "createdAt",
          "deletedAt",
          "events.event",
          "events.id",
          "events.data",
        ],
      },
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

    const queryResponse = await client.query(context, req);
    assert.deepEqual(queryResponse, expectedResult);
  });

  it("[87a54c7d] should throw an error when performing a query", async () => {
    mock.method(client, "post", async () => {
      return {
        response: {
          statusCode: 400,
          statusMessage: "Bad Request",
        },
      };
    });

    try {
      await client.query("1", ["id", "createdAt", "deletedAt"]);
    } catch (error) {
      assert(error.message, "Bad Request");
    }
  });
});
