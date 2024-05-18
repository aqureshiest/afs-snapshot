import { describe, it, before, mock } from "node:test";
import { v4 as uuidv4 } from "uuid";
import assert from "node:assert";

import createPluginContext from "@earnest-labs/microservice-chassis/createPluginContext.js";
import registerChassisPlugins from "@earnest-labs/microservice-chassis/registerChassisPlugins.js";
import readJsonFile from "@earnest-labs/microservice-chassis/readJsonFile.js";
import SensitiveString from "@earnest-labs/ts-sensitivestring";
import { Input as IContractInput } from "contract/manifest.js";
import LendingDecisionServiceClient from "./index.js";

describe("[96aaf9c1] Lending Decision Service Client", () => {
  let accessKey;
  let baseUrl;
  let context;
  let client;
  let key;
  const input = {
    application: null,
    request: {},
  } as IContractInput;
  const root = uuidv4();
  const primary = uuidv4();
  const cosigner = uuidv4();
  const primaryAppData = {
    id: root,
    relationships: [
      {
        id: primary,
        relationship: "applicant",
      },
    ],
    tags: ["primary_only"],
    applicants: [
      {
        id: primary,
        createdAt: "2024-02-22T20:24:10.140Z",
        ssnTokenURI: "pii-token://tokens/36db231d-4151-42e4-9a28-4d3d3d3",
        relationships: [
          {
            id: root,
            relationship: "root",
          },
        ],
        monolithApplicationID: "576326",
        details: {
          name: {
            first: "Nancy",
            last: "Birkhead",
          },
          dateOfBirth: "1938-10-14",
          email: "someemail@email.com",
          location: [
            {
              street1: "Fake Street1",
              street2: "Fake Street2",
              city: "Fake City",
              state: "CA",
              zip: "99999",
              citizenship: "citizen",
              type: "primary",
            },
          ],
          phone: [
            {
              type: "mobile",
              number: "5555555555",
            },
          ],
          education: [
            {
              degree: "bachelor",
              enrollment: "full_time",
              graduationDate: "2027-01-01",
              termStart: "2024-01-23",
              termEnd: "2027-01-01",
              credits: 5,
              opeid: "00130500",
            },
          ],
          income: [
            {
              amount: 2000000,
              type: "employment",
              employer: "company",
              name: null,
              title: "employee",
              start: "2020-01-01",
              end: "2050-01-01",
            },
            {
              amount: 2000000,
              type: "retirement",
            },
          ],
          financialAccounts: [
            {
              index: 0,
              name: "Chase",
              type: "checking",
              selected: true,
              account_last4: "0000",
              institution_name: null,
              monolithFinancialAccountID: "2177229",
              balance: 1100000,
              plaidItemID: "yG9aZ7ngMDua9ZWLrX8wIKVW1Wql3lIyVX5X9",
              plaidAccessToken:
                "access-sandbox-33ce1168-f5d1-44df-b31d-4f1ceaee748a",
            },
          ],
          amount: {
            requested: 1000000,
            approved: null,
            certified: null,
          },
          asset: [
            {
              type: "claimed_total_assets",
              amount: 2000000,
            },
          ],
        },
      },
    ],
  };
  const cosignedAppData = {
    id: root,
    relationships: [
      {
        id: primary,
        relationship: "applicant",
      },
      {
        id: cosigner,
        relationship: "applicant",
      },
    ],
    tags: ["cosigned", "serialization"],
    applicants: [
      {
        ...primaryAppData.applicants[0],
        relationships: [
          {
            id: root,
            relationship: "root",
          },
          {
            id: cosigner,
            relationship: "cosigner",
          },
        ],
      },
      {
        id: cosigner,
        createdAt: "2024-02-27T22:19:48.567Z",
        relationship: "applicant",
        ssnTokenURI: "pii-token://tokens/36db231d-4151-42e4-9a28-4d3d3d3",
        relationships: [
          {
            id: root,
            relationship: "root",
          },
          {
            id: primary,
            relationship: "primary",
          },
        ],
        details: {
          name: {
            first: "David",
            last: "Hans",
          },
          dateOfBirth: "1945-10-14",
          email: "someemail@email.com",
          location: [
            {
              street1: "Fake Street1",
              street2: "Fake Street2",
              city: "Fake City",
              state: "CA",
              zip: "99999",
              citizenship: "non-resident",
              type: "primary",
            },
          ],
          phone: [
            {
              type: "mobile",
              number: "5555555555",
            },
          ],
          education: [
            {
              degree: "bachelor",
              enrollment: "full_time",
              graduationDate: "2027-01-01",
              termStart: "2024-01-23",
              termEnd: "2027-01-01",
              credits: 5,
              opeid: "00130500",
            },
          ],
          income: [
            {
              amount: 2000000,
              type: "unspecified",
              employer: null,
              name: null,
              title: null,
              start: null,
              end: null,
            },
          ],
          amount: {
            requested: 1000000,
            approved: null,
            certified: null,
          },
        },
        cognitoID: null,
      },
    ],
  };

  before(async () => {
    const pkg = await readJsonFile("./package.json");
    pkg.logging = { level: "error" };

    context = await createPluginContext(pkg);
    await registerChassisPlugins(context);

    key =
      SensitiveString.ExtractValue(
        context.env.S2S_KEY_LDS_APPLY_FLOW_SERVICE,
      ) || "";
    accessKey = Buffer.from(key).toString("base64");
    baseUrl =
      SensitiveString.ExtractValue(context.env.LENDING_DECISION_SERVICE_URL) ||
      "";

    client = new LendingDecisionServiceClient(accessKey, baseUrl);
  });

  describe("[03df6e1e] Lending Decision Client Error tests", () => {
    it("[df87d50c] Throw error 'Decisioning Request was not found.' on GET request", async () => {
      mock.method(client, "get", async () => {
        return {
          response: {
            statusCode: 400,
            statusMessage: "Decisioning Request was not found.",
          },
        };
      });

      try {
        await client.getDecision(
          input,
          context,
          "721e917c-572c-4e81-b791-09c3bf1ea5c1",
        );
      } catch (error) {
        assert.strictEqual(
          error.message,
          "[31b3882a] Failed to get decision: Decisioning Request was not found.",
        );
      }
    });

    it("[96553a76] Throw an error when no Lending Decision ID is given to get request", async () => {
      try {
        await client.getDecision(input, context);
      } catch (error) {
        assert.strictEqual(
          error.message,
          "[3144deaa] missing lending decision id",
        );
      }
    });

    it("[d500977c] Throw an error on POST request to decision endpoint with app id and the response's status code !== 200", async () => {
      mock.method(
        context.loadedPlugins.applicationServiceClient.instance,
        "post",
        () => {
          return {
            results: {
              data: {
                application: {
                  ...primaryAppData,
                  applicants: [
                    {
                      ...primaryAppData.applicants[0],
                      details: {
                        ...primaryAppData.applicants[0].details,
                        location: [{}],
                        education: [{}],
                      },
                    },
                  ],
                },
              },
            },
            response: {
              statusCode: 200,
            },
          };
        },
      );

      mock.method(client, "post", async () => {
        return {
          response: {
            statusCode: 400,
            statusMessage: "Unable to process request.",
          },
        };
      });

      try {
        await client.postDecisionRequest(
          input,
          context,
          "12c7482c-7ec2-4513-b575-fa994f2adf88",
        );
      } catch (error) {
        assert.strictEqual(
          error.message,
          "[a571403f] Failed to post decision: Unable to process request.",
        );
      }
    });

    it("[cf74382e] Throw an error when no application ID is given to POST request", async () => {
      const missingASClientContext = {
        ...context,
        loadedPlugins: {
          ...context.loadedPlugins,
          applicationServiceClient: {},
        },
      };
      try {
        await client.postDecisionRequest(input, missingASClientContext);
      } catch (error) {
        assert.strictEqual(
          error.message,
          "[45ff82b1] Application Service client instance not found",
        );
      }
    });

    it("[a76813b3] Throw an error if details are not present in application", async () => {
      mock.method(
        context.loadedPlugins.applicationServiceClient.instance,
        "post",
        () => {
          return {
            results: {
              data: {
                application: {
                  ...primaryAppData,
                  applicants: [
                    { ...primaryAppData.applicants[0], details: undefined },
                  ],
                },
              },
            },
            response: {
              statusCode: 200,
            },
          };
        },
      );

      try {
        await client.postDecisionRequest(input, context, root);
      } catch (error) {
        assert.strictEqual(
          error.message,
          "[42b4cf11] Unable to parse application detail information",
        );
      }
    });

    it("[49b4267d] Throw error when trying to get App data", async () => {
      mock.method(
        context.loadedPlugins.applicationServiceClient.instance,
        "post",
        () => {
          return {
            results: {
              errors: [
                {
                  message: "Invalid",
                },
              ],
            },
            response: {
              statusCode: 400,
              statusMessage: "Application not found",
            },
          };
        },
      );

      try {
        await client.postDecisionRequest(input, context, root);
      } catch (error) {
        assert.strictEqual(error.message, "Application not found");
      }
    });
  });

  it("[8e943ff1] should get a decision", async () => {
    mock.method(client, "get", async () => {
      return {
        results: {
          message: "Decisioning Request found.",
          data: {
            decisioningToken: "16719670-a754-4719-a185-4f7e875bc04c",
            seedId: "12341234123412341234123421",
            status: "completed",
            journeyApplicationStatus: "waiting_review",
            requestedOn: "2024-02-19T21:33:20.407Z",
            decisionOutcome: "Application Review",
          },
        },
        response: {
          statusCode: 200,
        },
      };
    });

    const results = await client.getDecision(
      input,
      context,
      "16719670-a754-4719-a185-4f7e875bc04c",
    );

    assert.deepEqual(results.message, "Decisioning Request found.");
    assert.deepEqual(results.data.decisionOutcome, "Application Review");
    assert.deepEqual(results.data.status, "completed");
  });

  it("[6d9f1dd1] should post a primary app decision", async () => {
    mock.method(
      context.loadedPlugins.applicationServiceClient.instance,
      "post",
      () => {
        return {
          results: {
            data: {
              application: primaryAppData,
            },
          },
          response: {
            statusCode: 200,
          },
        };
      },
    );

    mock.method(client, "post", async () => {
      return {
        results: {
          message: "Decisioning Request is processed.",
          data: {
            decisioningToken: "16719670-a754-4719-a185-4f7e875bc04c",
            seedId: "12341234123412341234123421",
            status: "completed",
            journeyApplicationStatus: "waiting_review",
            decisionOutcome: "Application Review",
            journeyToken: "J-w34tsdgae4541234d",
            journeyApplicationToken: "JA-asdfasert45634",
          },
        },
        response: {
          statusCode: 200,
        },
      };
    });

    const results = await client.postDecisionRequest(input, context, root);

    assert.deepEqual(results.message, "Decisioning Request is processed.");
    assert.deepEqual(results.data.decisionOutcome, "Application Review");
    assert.deepEqual(results.data.status, "completed");
  });

  it("[36a5efe2] set the root application's status to 'submitted'", async () => {
    const mockFn = mock.fn(() => {
      return {
        results: {
          data: {
            application: primaryAppData,
          },
        },
        response: {
          statusCode: 200,
        },
      };
    });

    mock.method(
      context.loadedPlugins.applicationServiceClient.instance,
      "post",
      mockFn,
    );

    mock.method(client, "post", async () => {
      return {
        results: {
          message: "Decisioning Request is processed.",
          data: {
            decisioningToken: "16719670-a754-4719-a185-4f7e875bc04c",
            seedId: "12341234123412341234123421",
            status: "completed",
            journeyApplicationStatus: "waiting_review",
            decisionOutcome: "Approved",
            journeyToken: "J-w34tsdgae4541234d",
            journeyApplicationToken: "JA-asdfasert45634",
          },
        },
        response: {
          statusCode: 200,
        },
      };
    });

    await client.postDecisionRequest(input, context, root);

    const { body } = mockFn.mock.calls[3].arguments.at(0) as unknown as {
      body: { variables: { id: string; status: string } };
    };

    assert.equal(body.variables.id, primaryAppData.id);
    assert.equal(body.variables.status, "submitted");
  });

  it("[68361c40] should post a cosigned app decision", async () => {
    mock.method(
      context.loadedPlugins.applicationServiceClient.instance,
      "post",
      () => {
        return {
          results: {
            data: {
              application: cosignedAppData,
            },
          },
          response: {
            statusCode: 200,
          },
        };
      },
    );

    mock.method(client, "post", async () => {
      return {
        results: {
          message: "Decisioning Request is processed.",
          data: {
            decisioningToken: "16719670-a754-4719-a185-4f7e875bc04c",
            seedId: "12341234123412341234123421",
            status: "completed",
            journeyApplicationStatus: "waiting_review",
            decisionOutcome: "Application Review",
            journeyToken: "J-w34tsdgae4541234d",
            journeyApplicationToken: "JA-asdfasert45634",
          },
        },
        response: {
          statusCode: 200,
        },
      };
    });

    const results = await client.postDecisionRequest(input, context, root);

    assert.deepEqual(results.message, "Decisioning Request is processed.");
    assert.deepEqual(results.data.decisionOutcome, "Application Review");
    assert.deepEqual(results.data.status, "completed");
  });

  it("[f339b92e] should set a root application's status to 'approved' for APPLICATION_STATUS events with an 'Approved' decision", async () => {
    const mockFn = mock.fn(() => {
      return {
        results: {
          data: {
            applications: [
              {
                id: primary,
                root: {
                  id: root,
                },
                primary: null,
              },
            ],
          },
        },
        response: {
          statusCode: 200,
        },
      };
    });

    mock.method(
      context.loadedPlugins.applicationServiceClient.instance,
      "post",
      mockFn,
    );

    await client.saveDecision(input, context, "576326", {
      data: {
        decision: "Approved",
      },
      webhookType: "APPLICATION_STATUS",
    });

    const { body } = mockFn.mock.calls[3].arguments.at(0) as unknown as {
      body: { variables: { id: string; status: string } };
    };
    assert.equal(body.variables.id, root);
    assert.equal(body.variables.status, "approved");
  });

  it("[182f16c7] should set a root application's status to 'declined' for APPLICATION_STATUS events with an 'Denied' decision", async () => {
    const mockFn = mock.fn(() => {
      return {
        results: {
          data: {
            applications: [
              {
                id: primary,
                root: {
                  id: root,
                },
                primary: null,
              },
            ],
          },
        },
        response: {
          statusCode: 200,
        },
      };
    });

    mock.method(
      context.loadedPlugins.applicationServiceClient.instance,
      "post",
      mockFn,
    );

    await client.saveDecision(input, context, "576326", {
      data: {
        decision: "Approved",
      },
      webhookType: "APPLICATION_STATUS",
    });

    const { body } = mockFn.mock.calls[3].arguments.at(0) as unknown as {
      body: { variables: { id: string; status: string } };
    };
    assert(body.variables.id, root);
    assert(body.variables.status, "declined");
  });

  it("[9cbd8c40] should throw for APPLICATION_STATUS events when an unknown decision is sent", async () => {
    const mockFn = mock.fn(() => {
      return {
        results: {
          data: {
            applications: [
              {
                id: primary,
                root: {
                  id: root,
                },
                primary: null,
              },
            ],
          },
        },
        response: {
          statusCode: 200,
        },
      };
    });

    mock.method(
      context.loadedPlugins.applicationServiceClient.instance,
      "post",
      mockFn,
    );

    await assert.rejects(
      client.saveDecision(input, context, "576326", {
        data: {
          decision: "Unknown",
        },
        webhookType: "APPLICATION_STATUS",
      }),
      (error: Error) => {
        assert.equal(
          error.message,
          "[4b0a0bd3] Unhandled APPLICATION_STATUS event",
        );
        return true;
      },
    );
  });

  it("[79712798] should set an applicant's status to 'review' for APPLICATION_REVIEW events with an 'pending_review' entity status", async () => {
    const mockFn = mock.fn(() => {
      return {
        results: {
          data: {
            applications: [
              {
                id: primary,
                root: {
                  id: root,
                },
                primary: null,
              },
            ],
          },
        },
        response: {
          statusCode: 200,
        },
      };
    });

    mock.method(
      context.loadedPlugins.applicationServiceClient.instance,
      "post",
      mockFn,
    );

    await client.saveDecision(input, context, "576326", {
      data: {
        decision: "Pending",
        entity: {
          status: "pending_review",
        },
      },
      webhookType: "APPLICATION_REVIEW",
    });

    const { body } = mockFn.mock.calls[3].arguments.at(0) as unknown as {
      body: { variables: { id: string; status: string } };
    };
    assert(body.variables.id, primary);
    assert(body.variables.status, "review");
  });

  it("[52f1ee94] should throw for APPLICATION_REVIEW events when an unknown entity status is sent", async () => {
    const mockFn = mock.fn(() => {
      return {
        results: {
          data: {
            applications: [
              {
                id: primary,
                root: {
                  id: root,
                },
                primary: null,
              },
            ],
          },
        },
        response: {
          statusCode: 200,
        },
      };
    });

    mock.method(
      context.loadedPlugins.applicationServiceClient.instance,
      "post",
      mockFn,
    );

    await assert.rejects(
      client.saveDecision(input, context, "576326", {
        data: {
          decision: "Pending",
          entity: {
            status: "Unknown",
          },
        },
        webhookType: "APPLICATION_REVIEW",
      }),
      (error: Error) => {
        assert.equal(
          error.message,
          "[31d7e02f] Unhandled APPLICATION_REVIEW event",
        );
        return true;
      },
    );
  });

  it("[40a0b2ce] should set an applicant's status to 'ai_requested' for APPLICATION_DOCUMENT_REQUEST events with a 'pending_documents' entity status", async () => {
    const mockFn = mock.fn(() => {
      return {
        results: {
          data: {
            applications: [
              {
                id: primary,
                root: {
                  id: root,
                },
                primary: null,
              },
            ],
          },
        },
        response: {
          statusCode: 200,
        },
      };
    });

    mock.method(
      context.loadedPlugins.applicationServiceClient.instance,
      "post",
      mockFn,
    );

    await client.saveDecision(input, context, "576326", {
      data: {
        decision: "Pending",
        entity: {
          status: "pending_documents",
        },
      },
      webhookType: "APPLICATION_DOCUMENT_REQUEST",
    });

    const { body } = mockFn.mock.calls[3].arguments.at(0) as unknown as {
      body: { variables: { id: string; status: string } };
    };
    assert(body.variables.id, primary);
    assert(body.variables.status, "ai_requested");
  });

  it("[ffdeb465] should throw for APPLICATION_DOCUMENT_REQUEST events when an unknown entity status is sent", async () => {
    const mockFn = mock.fn(() => {
      return {
        results: {
          data: {
            applications: [
              {
                id: primary,
                root: {
                  id: root,
                },
                primary: null,
              },
            ],
          },
        },
        response: {
          statusCode: 200,
        },
      };
    });

    mock.method(
      context.loadedPlugins.applicationServiceClient.instance,
      "post",
      mockFn,
    );

    await assert.rejects(
      client.saveDecision(input, context, "576326", {
        data: {
          decision: "Pending",
          entity: {
            status: "Unknown",
          },
        },
        webhookType: "APPLICATION_DOCUMENT_REQUEST",
      }),
      (error: Error) => {
        assert.equal(
          error.message,
          "[94d72f20] Unhandled APPLICATION_DOCUMENT_REQUEST event",
        );
        return true;
      },
    );
  });

  it("[7e58cb91] should throw for unknown webhook events", async () => {
    const mockFn = mock.fn(() => {
      return {
        results: {
          data: {
            applications: [
              {
                id: primary,
                root: {
                  id: root,
                },
                primary: null,
              },
            ],
          },
        },
        response: {
          statusCode: 200,
        },
      };
    });

    mock.method(
      context.loadedPlugins.applicationServiceClient.instance,
      "post",
      mockFn,
    );

    await assert.rejects(
      client.saveDecision(input, context, "576326", {
        data: {
          decision: "Pending",
        },
        webhookType: "UNKNOWN",
      }),
      (error: Error) => {
        assert.equal(error.message, "[3320c677] Unhandled webhook event");
        return true;
      },
    );
  });
});
