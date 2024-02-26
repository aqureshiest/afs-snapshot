import { describe, it, before, mock } from "node:test";
import { v4 as uuidv4 } from "uuid";
import assert from "node:assert";

import createPluginContext from "@earnest-labs/microservice-chassis/createPluginContext.js";
import registerChassisPlugins from "@earnest-labs/microservice-chassis/registerChassisPlugins.js";
import readJsonFile from "@earnest-labs/microservice-chassis/readJsonFile.js";
import SensitiveString from "@earnest-labs/ts-sensitivestring";

import LendingDecisionServiceClient from "./index.js";
import ApplicationServiceClient from "../application-service/index.js";

describe("[96aaf9c1] Lending Decision Service Client", () => {
  let accessKey;
  let baseUrl;
  let context;
  let client;
  let key;
  let appServiceKey;
  let appServiceAccessKey;
  let appServicebaseUrl;
  let applicationServiceClient;

  const root = uuidv4();
  const primary = uuidv4();
  const appData = {
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
        ssn: "pii-token://tokens/36db231d-4151-42e4-9a28-4d3d3d3",
        relationships: [
          {
            id: root,
            relationship: "root",
          },
        ],
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
          ],
          amount: {
            requested: 1000000,
            approved: null,
            certified: null,
          },
        },
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
    appServiceKey = SensitiveString.ExtractValue(context.env.ACCESS_KEY) || "";
    appServiceAccessKey = Buffer.from(appServiceKey).toString("base64");
    appServicebaseUrl =
      SensitiveString.ExtractValue(context.env.APPLICATION_SERVICE_URL) || "";

    applicationServiceClient = new ApplicationServiceClient(
      context,
      appServiceAccessKey,
      appServicebaseUrl,
    );

    mock.method(applicationServiceClient, "getApplication", async () => {
      return appData;
    });

    context.loadedPlugins.applicationServiceClient.instance =
      applicationServiceClient;
    client = new LendingDecisionServiceClient(context, accessKey, baseUrl);
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
        await client.getDecision(context);
      } catch (error) {
        assert.strictEqual(
          error.message,
          "[3144deaa] missing lending decision id",
        );
      }
    });

    it("[d500977c] Throw an error on POST request to decision endpoint with app id and the response's status code !== 200", async () => {
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
        await client.postDecisionRequest(missingASClientContext);
      } catch (error) {
        assert.strictEqual(
          error.message,
          "[45ff82b1] Application Service client instance not found",
        );
      }
    });

    it("[424daac0] Throw an error during format payload due to missing accreditedSchoolService", async () => {
      const missingServiceClientContext = {
        ...context,
        loadedPlugins: {
          ...context.loadedPlugins,
          accreditedSchoolService: {},
        },
      };
      try {
        await client.postDecisionRequest(missingServiceClientContext, root);
      } catch (error) {
        assert.strictEqual(
          error.message,
          "[d826cb3e] Accredited School Service client instance not found",
        );
      }
    });

    it("[9a93d700] Throw an error during format payload due to missing PII Token Service", async () => {
      const missingServiceClientContext = {
        ...context,
        loadedPlugins: {
          ...context.loadedPlugins,
          piiTokenService: {},
        },
      };
      try {
        await client.postDecisionRequest(missingServiceClientContext, root);
      } catch (error) {
        assert.strictEqual(
          error.message,
          "[61e82544] PII Token Service client instance not found",
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
      context,
      "16719670-a754-4719-a185-4f7e875bc04c",
    );

    assert.deepEqual(results.message, "Decisioning Request found.");
    assert.deepEqual(results.data.decisionOutcome, "Application Review");
    assert.deepEqual(results.data.status, "completed");
  });

  it("[6d9f1dd1] should post a decision", async () => {
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

    const results = await client.postDecisionRequest(context, root);

    assert.deepEqual(results.message, "Decisioning Request is processed.");
    assert.deepEqual(results.data.decisionOutcome, "Application Review");
    assert.deepEqual(results.data.status, "completed");
  });
});
