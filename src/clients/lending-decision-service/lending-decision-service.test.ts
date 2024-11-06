import { describe, it, before, mock } from "node:test";
import assert from "node:assert";
import { v4 as uuidv4 } from "uuid";
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
  let calcClient;
  let key;
  let neasClient;
  const input = {
    auth: {
      strategies: ["internal"],
      isInternal: true,
      isValid: true,
      isAuthorized: true,
      artifacts: {
        source: "lending-decisioning-service",
        userId: uuidv4(),
        verified: true,
      },
    },
    application: null,
    request: {},
  } as unknown as IContractInput<unknown>;
  const root = uuidv4();
  const primary = uuidv4();
  const cosigner = uuidv4();

  /**
   * TODO: OH GOD I SHOULD THROW THESE INTO MOUNTEBANK
   */
  const primaryAppData = {
    id: root,
    details: {
      amount: {
        requested: 6000000,
        approved: null,
        certified: null,
      },
    },
    brand: "earnest",
    product: "student-refi",
    lendingDecisionID: [],
    tags: ["incomplete", "primary_only"],
    status: null,
    partnerName: null,
    partnerDiscountAmount: null,
    rateMapTag: "minus_20_bps_test",
    rateMapVersion: "193",
    referralProgramId: null,
    monolithApplicationID: null,
    monolithLoanID: "587842",
    monolithUserID: null,
    tag: {
      applicants: "primary_only",
      serialization: null,
      status: "incomplete",
    },
    root: null,
    applicants: [
      {
        id: primary,
        createdAt: "2024-02-22T20:24:10.140Z",
        ssnTokenURI: "pii-token://tokens/6b4d7cb7-e34f-4425-af66-108d2e563692",
        relationship: null,
        partnerDiscountAmount: null,
        tag: {
          applicants: "primary_only",
          serialization: null,
          status: "incomplete",
        },
        lenderId: null,
        lendingCheckoutID: null,
        lendingDecisionID: [],
        status: null,
        lookupHash: [],
        monolithApplicationID: "576326",
        monolithLoanID: null,
        monolithUserID: null,
        partnerName: null,
        product: null,
        rateMapTag: null,
        rateMapVersion: null,
        referralProgramId: null,
        reference: {
          userID: null,
          brand: null,
          cognitoID: null,
          lender: null,
          lenderId: null,
          lendingCheckoutID: null,
          lendingDecisionID: [],
          lookupHash: [],
          monolithApplicationID: "603233",
          monolithLoanID: null,
          monolithUserID: "1977678",
          partnerName: null,
          product: null,
          rateMapTag: null,
          rateMapVersion: null,
          referralProgramId: null,
          ssnTokenURI:
            "pii-token://tokens/6b4d7cb7-e34f-4425-af66-108d2e563692",
        },
        relationships: [
          {
            id: root,
            relationship: "root",
          },
        ],
        details: {
          deviceId: uuidv4(),
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
              plaidAssetsReportID:
                "assets-sandbox-33ce1168-f5d1-44df-b31d-4f1ceaee748a",
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

  /**
   * TODO: OH GOD I SHOULD THROW THESE INTO MOUNTEBANK
   */
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
          deviceId: uuidv4(),
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
    calcClient = context.loadedPlugins.calculatorServiceClient.instance;
    neasClient = context.loadedPlugins.NeasClient.instance;
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

      const request = client.postDecisionRequest(
        input,
        context,
        "12c7482c-7ec2-4513-b575-fa994f2adf88",
      );

      await assert.rejects(request);
    });

    it("[cf74382e] Throw an error when application service not present to POST request", async () => {
      const missingASClientContext = {
        ...context,
        loadedPlugins: {
          ...context.loadedPlugins,
          applicationServiceClient: {},
        },
      };

      const request = client.postDecisionRequest(input, missingASClientContext);

      await assert.rejects(request);
    });

    it("[4e68ad9a] Throw an error when pii token service not present to POST request", async () => {
      const missingPIIClientContext = {
        ...context,
        loadedPlugins: {
          ...context.loadedPlugins,
          piiTokenServiceClient: {},
        },
      };

      const request = client.postDecisionRequest(
        input,
        missingPIIClientContext,
      );

      await assert.rejects(request);
    });

    it("[2d7098c1] Throw an error when accredited school service not present to POST request", async () => {
      const missingSchoolClientContext = {
        ...context,
        loadedPlugins: {
          ...context.loadedPlugins,
          accreditedSchoolService: {},
        },
      };

      const request = client.postDecisionRequest(
        input,
        missingSchoolClientContext,
      );

      await assert.rejects(request);
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

    it("[916993ed] Throw an error on POST request to rate checkendpoint", async () => {
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
          response: {
            statusCode: 400,
            statusMessage: "Unable to process request.",
          },
        };
      });

      try {
        await client.rateCheckRequest(
          input,
          context,
          "12c7482c-7ec2-4513-b575-fa994f2adf88",
        );
      } catch (error) {
        assert.strictEqual(
          error.message,
          "[53a1b21d] Failed to post rate check: Unable to process request.",
        );
      }
    });

    it("[f1132d41] Throw an error on GET of artifacts", async () => {
      mock.method(client, "get", async () => {
        return {
          response: {
            statusCode: 400,
            statusMessage: "Cannot read properties of undefined (reading 'id')",
          },
        };
      });

      try {
        await client.getArtifacts(
          input,
          context,
          "decisioning-request",
          "721e917c-572c-4e81-b791-09c3bf1ea5c1",
          "rate_check",
        );
      } catch (error) {
        assert.strictEqual(
          error.message,
          "[de6308f4] Failed to get artifacts: Cannot read properties of undefined (reading 'id')",
        );
      }
    });

    it("[c1b91977] Throw an error on GET of price curves", async () => {
      mock.method(client, "get", async () => {
        return {
          response: {
            statusCode: 400,
            statusMessage: "Cannot read properties of undefined (reading 'id')",
          },
        };
      });

      try {
        await client.getPaymentsAndRates(
          input,
          context,
          "decisioning-request",
          "721e917c-572c-4e81-b791-09c3bf1ea5c1",
        );
      } catch (error) {
        assert.strictEqual(
          error.message,
          "[378e8d85] Failed to get artifacts: Cannot read properties of undefined (reading 'id')",
        );
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

  it("[692d13ff] should post a primary v2 app decision", async () => {
    const primaryV2App = {
      ...primaryAppData,
      monolithLoanID: null,
      applicants: [
        {
          ...primaryAppData.applicants[0],
          monolithApplicationID: null,
          reference: {
            ...primaryAppData.applicants[0].reference,
            monolithApplicationID: null,
            monolithUserID: null,
          },
        },
      ],
    };

    mock.method(
      context.loadedPlugins.applicationServiceClient.instance,
      "post",
      () => {
        return {
          results: {
            data: {
              application: primaryV2App,
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

  it("[e4944ada] should post a primary v2 app decision with unverified userID", async () => {
    const primaryV2App = {
      ...primaryAppData,
      monolithLoanID: null,
      applicants: [
        {
          ...primaryAppData.applicants[0],
          monolithApplicationID: null,
          reference: {
            ...primaryAppData.applicants[0].reference,
            monolithApplicationID: null,
            monolithUserID: null,
          },
        },
      ],
    };

    const otherInput = {
      ...input,
      auth: {
        ...input.auth,
        artifacts: {
          ...input?.auth?.artifacts,
          verified: false,
        },
      },
    };

    mock.method(
      context.loadedPlugins.applicationServiceClient.instance,
      "post",
      () => {
        return {
          results: {
            data: {
              application: primaryV2App,
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

    const results = await client.postDecisionRequest(otherInput, context, root);

    assert.deepEqual(results.message, "Decisioning Request is processed.");
    assert.deepEqual(results.data.decisionOutcome, "Application Review");
    assert.deepEqual(results.data.status, "completed");
  });

  it("[048dac00] should post a parent plus v2 app decision", async () => {
    const beneficiaryID = uuidv4();
    const benefactor = {
      ...primaryAppData.applicants[0],
      monolithApplicationID: null,
      reference: {
        ...primaryAppData.applicants[0].reference,
        monolithApplicationID: null,
        monolithUserID: null,
      },
      relationships: [
        {
          id: root,
          relationship: "root",
        },
        {
          id: beneficiaryID,
          relationship: "beneficiary",
        },
      ],
      details: {
        ...primaryAppData.applicants[0].details,
        education: [
          {
            degree: "high_school",
            graduationDate: "2027-01-01",
          },
        ],
      },
    };
    const beneficiary = {
      id: beneficiaryID,
      details: {
        education: [
          {
            degree: "bachelors",
            enrollment: null,
            graduationDate: "2015-01-01",
            termStart: null,
            termEnd: null,
            credits: null,
            opeid: "00115500",
          },
        ],
      },
    };
    const parentApp = {
      ...primaryAppData,
      tags: ["incomplete", "parent_plus"],
      tag: {
        applicants: "parent_plus",
        serialization: null,
        status: "incomplete",
      },
      monolithLoanID: null,
      benefactor: benefactor,
      beneficiary: beneficiary,
      applicants: [benefactor, beneficiary],
    };

    mock.method(
      context.loadedPlugins.applicationServiceClient.instance,
      "post",
      () => {
        return {
          results: {
            data: {
              application: parentApp,
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

    const { body } = mockFn.mock.calls[5].arguments.at(0) as unknown as {
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

  it("[edbe14de] should set a root application's status to 'approved' for APPLICATION_STATUS events with an 'Approved' decision", async () => {
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

    await client.saveDecision(input, context, root, {
      data: {
        decision: "Approved",
      },
      webhookType: "APPLICATION_STATUS",
    });

    const { body } = mockFn.mock.calls[3].arguments.at(0) as unknown as {
      body: { variables: { id: string; status: string } };
    };
    assert.equal(body.variables.id, primary);
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
        decision: "Denied",
      },
      webhookType: "APPLICATION_STATUS",
    });

    const { body } = mockFn.mock.calls[3].arguments.at(0) as unknown as {
      body: { variables: { id: string; status: string } };
    };
    assert(body.variables.id, root);
    assert(body.variables.status, "declined");
  });

  it("[8e796cf7] should set a root application's status to 'expired' for APPLICATION_STATUS events with an 'Time out' decision", async () => {
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
        decision: "Time out",
      },
      webhookType: "APPLICATION_STATUS",
    });

    const { body } = mockFn.mock.calls[3].arguments.at(0) as unknown as {
      body: { variables: { id: string; status: string } };
    };
    assert(body.variables.id, root);
    assert(body.variables.status, "expired");
  });

  it("[f2e72388] should set a root application's status to 'withdrawn' for APPLICATION_STATUS events with an 'Withdrawn' decision", async () => {
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
        decision: "Withdrawn",
      },
      webhookType: "APPLICATION_STATUS",
    });

    const { body } = mockFn.mock.calls[3].arguments.at(0) as unknown as {
      body: { variables: { id: string; status: string } };
    };
    assert(body.variables.id, root);
    assert(body.variables.status, "withdrawn");
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

  it("[4c477723] should post a rate estimate request", async () => {
    const { applicants } = primaryAppData;
    const { details, ...restOfApplicants } = applicants[0];
    const { income, financialAccounts, ...restOfDetails } = details;

    const newDetails = {
      income: [
        {
          amount: 2000000,
          type: null,
          employer: null,
          name: null,
          title: null,
          start: null,
          end: null,
        },
      ],
      ...restOfDetails,
    };
    const newApplicants = [{ ...restOfApplicants, details: newDetails }];
    const artifacts = {
      priceCurve: [
        {
          rates: [
            {
              rate: 5.71,
              rate_type: "fixed",
            },
            {
              rate: 6.31,
              rate_type: "variable",
            },
          ],
          score: 6.6566,
          term_months: 60,
        },
        {
          rates: [
            {
              rate: 5.72,
              rate_type: "fixed",
            },
            {
              rate: 6.31,
              rate_type: "variable",
            },
          ],
          score: 6.6566,
          term_months: 61,
        },
      ],
      scoreCurve: [
        {
          score: 7,
          sub_scores: {
            fico: 1.4818,
            assets: 1.549,
            income: 1.3575,
            degree_type: 0,
            school_rank: 0,
            free_cash_flow: 1.4,
            school_cdr_effect: 0,
            assets_to_loan_ratio: 1.01,
            credit_card_to_income_ratio: 0.525,
          },
          backend_dti: 0.1482,
          term_months: 60,
          fixed_expenses_cents: 253125,
          free_cash_flow_cents: 894407,
          revised_assets_cents: 125000000,
          excess_free_cash_flow_cents: 0,
          estimated_monthly_payment_cents: 112925,
        },
      ],
      ficoScore: 759,
      softInquiryDate: "2024-07-24T00:00:00.000Z",
      softApprovedAmount: 6000000,
      modelVersion: "1.235-19bbaa0",
      rateMapVersion: 193,
      stateLimitsVersion: "2019-12-20",
      variableCapsVersion: "2017-06-01",
      rateMapTag: "plus_20_bps_test",
      grossAnnualIncome: 20500000,
      netAnnualIncome: 13770389,
      assetsAmount: 125000000,
      monthlyHousingExpense: 101200,
    };

    mock.method(
      context.loadedPlugins.applicationServiceClient.instance,
      "post",
      () => {
        return {
          results: {
            data: {
              application: { ...primaryAppData, applicants: newApplicants },
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
            decisioningToken: "5ffa351f-b39a-490d-b91c-9a541f7d3443",
            seedId: "29527758200557436062858034636007009573",
            status: "completed",
            journeyApplicationStatus: "completed",
            decisionOutcome: "Approved",
            journeyToken: "J-yUGcTupSXm0GAbBmYNIZ",
            journeyApplicationToken: "JA-n4fGh8OBXs64DAzRVftV",
            artifacts: artifacts,
          },
        },
        response: {
          statusCode: 200,
        },
      };
    });

    const results = await client.rateCheckRequest(input, context, root);

    assert.deepEqual(results.message, "Decisioning Request is processed.");
    assert.deepEqual(results.data.decisionOutcome, "Approved");
    assert.deepEqual(results.data.artifacts, artifacts);
  });

  it("[0ff6b7b5] should get artifacts", async () => {
    /**
     * TODO: OH GOD I SHOULD THROW THESE INTO MOUNTEBANK
     */
    const priceCurves = [
      {
        rates: [
          {
            rate: 5.71,
            rate_type: "fixed",
          },
          {
            rate: 6.31,
            rate_type: "variable",
          },
        ],
        score: 6.6566,
        term_months: 60,
      },
      {
        rates: [
          {
            rate: 5.72,
            rate_type: "fixed",
          },
          {
            rate: 6.31,
            rate_type: "variable",
          },
        ],
        score: 6.6566,
        term_months: 61,
      },
    ];
    const artifacts = {
      priceCurve: priceCurves,
      scoreCurve: [
        {
          score: 7,
          sub_scores: {
            fico: 1.4818,
            assets: 1.549,
            income: 1.3575,
            degree_type: 0,
            school_rank: 0,
            free_cash_flow: 1.4,
            school_cdr_effect: 0,
            assets_to_loan_ratio: 1.01,
            credit_card_to_income_ratio: 0.525,
          },
          backend_dti: 0.1482,
          term_months: 60,
          fixed_expenses_cents: 253125,
          free_cash_flow_cents: 894407,
          revised_assets_cents: 125000000,
          excess_free_cash_flow_cents: 0,
          estimated_monthly_payment_cents: 112925,
        },
      ],
      ficoScore: 759,
      softInquiryDate: "2024-07-24T00:00:00.000Z",
      softApprovedAmount: 6000000,
      modelVersion: "1.235-19bbaa0",
      rateMapVersion: 193,
      stateLimitsVersion: "2019-12-20",
      variableCapsVersion: "2017-06-01",
      rateMapTag: "plus_20_bps_test",
      grossAnnualIncome: 20500000,
      netAnnualIncome: 13770389,
      assetsAmount: 125000000,
      monthlyHousingExpense: 101200,
    };

    mock.method(client, "get", async () => {
      return {
        results: {
          data: {
            applicationId: "602935",
            decisioningToken: "16719670-a754-4719-a185-4f7e875bc04c",
            artifacts: artifacts,
          },
        },
        response: {
          statusCode: 200,
        },
      };
    });

    const results = await client.getArtifacts(
      input,
      context,
      "decisioning-request",
      "16719670-a754-4719-a185-4f7e875bc04c",
      "rate_check",
    );

    assert.deepEqual(results.data.applicationId, "602935");
    assert.deepEqual(
      results.data.decisioningToken,
      "16719670-a754-4719-a185-4f7e875bc04c",
    );
    assert.deepEqual(results.data.artifacts, artifacts);
    assert.deepEqual(results.data.artifacts.priceCurve, priceCurves);
  });

  it("[2cd0d3d6] should get price curves", async () => {
    /**
     * TODO: OH GOD I SHOULD THROW THESE INTO MOUNTEBANK
     */
    const priceCurves = [
      {
        rates: [
          {
            rate: 5.71,
            rate_type: "fixed",
          },
          {
            rate: 6.31,
            rate_type: "variable",
          },
        ],
        score: 6.6566,
        term_months: 60,
      },
    ];

    const artifacts = {
      priceCurve: priceCurves,
      scoreCurve: [
        {
          score: 7,
          sub_scores: {
            fico: 1.4818,
            assets: 1.549,
            income: 1.3575,
            degree_type: 0,
            school_rank: 0,
            free_cash_flow: 1.4,
            school_cdr_effect: 0,
            assets_to_loan_ratio: 1.01,
            credit_card_to_income_ratio: 0.525,
          },
          backend_dti: 0.1482,
          term_months: 60,
          fixed_expenses_cents: 253125,
          free_cash_flow_cents: 894407,
          revised_assets_cents: 125000000,
          excess_free_cash_flow_cents: 0,
          estimated_monthly_payment_cents: 112925,
        },
      ],
      ficoScore: 759,
      softInquiryDate: "2024-07-24T00:00:00.000Z",
      softApprovedAmount: 6000000,
      modelVersion: "1.235-19bbaa0",
      rateMapVersion: 193,
      stateLimitsVersion: "2019-12-20",
      variableCapsVersion: "2017-06-01",
      rateMapTag: "plus_20_bps_test",
      grossAnnualIncome: 20500000,
      netAnnualIncome: 13770389,
      assetsAmount: 125000000,
      monthlyHousingExpense: 101200,
    };

    mock.method(calcClient, "post", async () => {
      return {
        results: {
          prices: [
            {
              rateInBps: 532,
              uwLoanTermInMonths: 60,
              rateType: "fixed",
              startingPrincipalBalanceInCents: 6000000,
              date: "2024-08-08T00:00:00.000Z",
              dateType: "fti",
              priceId: 0,
              minimumPaymentAmountInCents: 114566,
            },
            {
              rateInBps: 631,
              uwLoanTermInMonths: 60,
              rateType: "variable",
              startingPrincipalBalanceInCents: 6000000,
              date: "2024-08-08T00:00:00.000Z",
              dateType: "fti",
              priceId: 1,
              minimumPaymentAmountInCents: 117424,
            },
          ],
        },
        response: {
          statusCode: 200,
        },
      };
    });

    mock.method(client, "get", async () => {
      return {
        results: {
          data: {
            applicationId: "602935",
            decisioningToken: "16719670-a754-4719-a185-4f7e875bc04c",
            artifacts: artifacts,
          },
        },
        response: {
          statusCode: 200,
        },
      };
    });

    const filteredPrices = [
      {
        rate: 532,
        rateType: "fixed",
        term: 60,
        minPaymentAmountInCents: 114566,
      },
      {
        rate: 631,
        rateType: "variable",
        term: 60,
        minPaymentAmountInCents: 117424,
      },
    ];
    const results = await client.getPaymentsAndRates(
      input,
      context,
      "16719670-a754-4719-a185-4f7e875bc04c",
      {
        type: "decisioning-request",
      },
    );

    assert.deepEqual(results, filteredPrices);
  });

  it("[61ae1ac5] get userID from NEAS", async () => {
    const emailId = "someemail@email.com";
    const userID = uuidv4();

    mock.method(neasClient, "post", async () => {
      return {
        results: {
          userIdMap: {
            uuid: "f5a24fc9-2dc8-4178-ac20-ea0d7998e503",
            user_id: userID,
            email_id: emailId,
            created_at: "2024-09-24T07:34:02.805Z",
            updated_at: "2024-09-24T07:34:02.805Z",
          },
        },
        response: {
          statusCode: 200,
        },
      };
    });

    const result = await client.getNEASUserID(
      context,
      primaryAppData.applicants[0],
    );
    assert.deepEqual(result, userID);
  });

  it("[8b4a8bb6] Should throw 404 when user id not found", async () => {
    mock.method(neasClient, "post", async () => {
      return {
        results: {
          message: "User not found",
        },
        response: {
          statusCode: 404,
        },
      };
    });
    await assert.rejects(
      client.getNEASUserID(context, primaryAppData.applicants[0]),
    );
  });

  it("[cc129277] Should throw when no email given", async () => {
    const missingEmailApplicant = {
      ...primaryAppData.applicants[0],
      details: {
        ...primaryAppData.applicants[0].details,
        email: null,
      },
    };
    try {
      await client.getNEASUserID(context, missingEmailApplicant);
    } catch (error) {
      assert.strictEqual(error.message, "[84338d44] Missing applicant Email");
    }
  });

  it("[f4035eef] build request meta dataIDs", async () => {
    const primaryUserID = uuidv4();
    const primaryAppID = uuidv4();
    const cosignerAppID = uuidv4();
    const cosignerUserID = uuidv4();
    const applicationRefID = 1;
    const applicationID = uuidv4();
    const primaryDeviceId = uuidv4();
    const cosignerDeviceId = uuidv4();

    const primaryApplicants = {
      id: primaryAppID,
      reference: {
        userID: primaryUserID,
      },
      details: {
        deviceId: primaryDeviceId,
      },
    };

    const cosingerApplicants = {
      id: cosignerAppID,
      reference: {
        userID: cosignerUserID,
      },
      details: {
        deviceId: cosignerDeviceId,
      },
    };

    const application = {
      id: applicationID,
      refId: applicationRefID,
      primary: primaryApplicants,
      cosigner: cosingerApplicants,
    };
    const expected = {
      rootApplicationId: applicationID,
      applicationRefId: applicationRefID,
      applicationId: primaryAppID,
      userId: primaryUserID,
      cosignerUserId: cosignerUserID,
      cosignerApplicationId: cosignerAppID,
      deviceId: primaryDeviceId,
      cosignerDeviceId: cosignerDeviceId,
    };
    const result = await client.buildRequestMetaDataIDs(
      input,
      context,
      "cosigned",
      application,
      "cosigner",
      uuidv4(),
    );
    assert.deepEqual(result, expected);
  });

  it("[18618dc3] assert for missing primary in buildRequestMetaDataIDs", async () => {
    const cosignerAppID = uuidv4();
    const cosignerUserID = uuidv4();
    const applicationRefID = uuidv4();
    const applicationID = uuidv4();

    const cosingerApplicants = {
      id: cosignerAppID,
      reference: {
        userID: cosignerUserID,
      },
    };

    const application = {
      id: applicationID,
      refId: applicationRefID,
      cosigner: cosingerApplicants,
    };
    await assert.rejects(
      client.buildRequestMetaDataIDs(
        input,
        context,
        "cosigned",
        application,
        "cosigner",
        uuidv4(),
      ),
    );
  });
});
