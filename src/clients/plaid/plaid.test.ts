import { describe, it, before, mock } from "node:test";
import assert from "node:assert";

import createPluginContext from "@earnest-labs/microservice-chassis/createPluginContext.js";
import registerChassisPlugins from "@earnest-labs/microservice-chassis/registerChassisPlugins.js";
import readJsonFile from "@earnest-labs/microservice-chassis/readJsonFile.js";
import PlaidClient from "./index.js";

describe("[f8395630] Plaid Client", () => {
  let context;
  let client: PlaidClient;

  const financialAccountsMock = [
    {
      index: 0,
      name: "Houndstooth Bank",
      type: "checking",
      selected: true,
      account_last4: "0000",
      balance: 11000,
      plaidAccountID: "A3wenK5EQRfKlnxlBbVXtPw9gyazDWu1EdaZD",
      plaidItemID: "gVM8b7wWA5FEVkjVom3ri7oRXGG4mPIgNNrBy",
      plaidAccessToken: "access-sandbox-de3ce8ef-33f8-452c-a685-8671031fc0f6",
    },
    {
      index: 1,
      name: "Houndstooth Bank",
      type: "savings",
      selected: true,
      account_last4: "1111",
      balance: 21100,
      plaidAccountID: "GPnpQdbD35uKdxndAwmbt6aRXryj4AC1yQqmd",
      plaidItemID: "gVM8b7wWA5FEVkjVom3ri7oRXGG4mPIgNNrBy",
      plaidAccessToken: "access-sandbox-de3ce8ef-33f8-452c-a685-8671031fc0f6",
    },
  ];

  before(async () => {
    const pkg = await readJsonFile("./package.json");
    pkg.logging = { level: "error" };

    context = await createPluginContext(pkg);
    await registerChassisPlugins(context);
    client = context.loadedPlugins.plaid.instance;
  });

  it("[a99b44e4] should be able get a list of institutions", async () => {
    const { results } = await client.searchInstitutions(
      context,
      {} as Application,
      "123",
      {
        query: "chase",
      },
    );
    assert.deepStrictEqual(
      results?.[0].name,
      "Red Platypus Bank - Red Platypus Bank",
    );
  });

  it("[a99b44e4] should thow if no query params provided", async () => {
    const request = client.searchInstitutions(
      context,
      {} as Application,
      "123",
      {} as Parameters<typeof client.searchInstitutions>[3],
    );
    await assert.rejects(request);
  });

  it("[a99b44e4] should thow if request to plaid fails", async () => {
    mock.method(client, "post", async () => {
      return {
        response: {
          statusCode: 400,
          statusMessage: "invalid request",
        },
      };
    });
    const request = client.searchInstitutions(
      context,
      {} as Application,
      "123",
      {
        query: "chase",
      },
    );
    await assert.rejects(request);
  });

  it("[560375ed] should be able get link token", async () => {
    mock.reset();
    const { results } = await client.createLinkToken(
      context,
      {} as Application,
      "123",
      {} as Parameters<typeof client.createLinkToken>[3],
    );

    assert.equal(results, "link-sandbox-33792986-2b9c-4b80-b1f2-518caaac6183");
  });

  it("[6d6a7fdf] should throw error when unable to generate link_token", async () => {
    mock.method(client, "post", async () => {
      return {
        response: {
          statusCode: 400,
          statusMessage: "invalid request",
        },
      };
    });

    const request = client.createLinkToken(
      context,
      {} as Application,
      "123",
      {} as Parameters<typeof client.createLinkToken>[3],
    );
    await assert.rejects(request);
  });

  it("[38a27b34] should be able get accounts from an access token", async () => {
    mock.reset();
    const { results } = await client.getAccounts(
      context,
      {} as Application,
      "123",
      {
        access_token: "asasdasdasd",
      },
    );

    assert(results, "Did not return results");
    assert.deepEqual(results.accounts.length, 3);
  });

  it("[6dd970c3] should return error when unable to get accounts", async () => {
    mock.method(client, "post", async () => {
      return {
        response: {
          statusCode: 400,
          statusMessage: "invalid request",
        },
      };
    });
    const { errors } = await client.getAccounts(
      context,
      {} as Application,
      "123",
      {
        access_token: "asdasdasdasd",
      },
    );

    assert.ok(errors.length, "Did not populate errors");
  });

  it("[933e422b] should be able to get an insitution from plaid by id", async () => {
    mock.reset();
    const response = await client.getInstitution(
      context,
      {} as Application,
      "123",
      {
        institution_id: "ins_1",
      },
    );

    assert.deepEqual(response.name, "Houndstooth Bank");
  });
  it("[2ec315a0] should throw error when plaid request fails", async () => {
    mock.method(client, "post", async () => {
      return {
        response: {
          statusCode: 400,
          statusMessage: "invalid request",
        },
      };
    });
    const request = client.getInstitution(context, {} as Application, "123", {
      institution_id: "ins_1",
    });
    await assert.rejects(request);
  });

  it("[6ec3a779] should be able to exchange public_token for access_token", async () => {
    mock.reset();
    const { results } = await client.exchangePublicToken(
      context,
      {} as Application,
      "123",
      {
        public_token: "asdasdasdasd",
      },
    );

    assert.deepEqual(results, {
      access_token: "access-sandbox-de3ce8ef-33f8-452c-a685-8671031fc0f6",
      item_id: "M5eVJqLnv3tbzdngLDp9FL5OlDNxlNhlE55op",
      request_id: "Aim3b",
    });
  });

  it("[48b538fe] should return error when plaid request fails", async () => {
    mock.method(client, "post", async () => {
      return {
        response: {
          statusCode: 400,
          statusMessage: "invalid request",
        },
      };
    });
    const { errors } = await client.exchangePublicToken(
      context,
      {} as Application,
      "123",
      {
        public_token: "asdasdasdasd",
      },
    );

    assert.ok(errors, "Did not populate errors");
  });

  it("[9a3872eb] should be able to exchangePublicTokenAndGetAccounts()", async () => {
    mock.reset();
    mock.method(
      context.loadedPlugins.applicationServiceClient.instance,
      "sendRequest",
      async () => {
        return {
          addDetails: {
            application: {
              details: {
                financialAccounts: financialAccountsMock,
              },
            },
            error: null,
          },
        };
      },
    );

    const { results } = await client.exchangePublicTokenAndGetAccounts(
      context,
      {} as Application,
      "123",
      {
        public_token: "asdasdasdasd",
      },
    );

    assert.deepEqual(
      results,
      financialAccountsMock.map((account) => {
        return {
          index: account?.index,
          name: account?.name,
          type: account?.type,
          selected: account?.selected,
          account_last4: account?.account_last4,
          balance: account?.balance,
        };
      }),
    );
  });
  it("[bd4ff0b3] should be able to handle duplications", async () => {
    mock.reset();
    mock.method(
      context.loadedPlugins.applicationServiceClient.instance,
      "sendRequest",
      async () => {
        return {
          addDetails: {
            application: {
              details: {
                financialAccounts: financialAccountsMock,
              },
            },
            error: null,
          },
        };
      },
    );

    const application = {
      id: "root-123",
      applicants: [
        { id: "123", details: { financialAccounts: financialAccountsMock } },
      ],
    };

    const { errors, results } = await client.exchangePublicTokenAndGetAccounts(
      context,
      application,
      "123",
      {
        public_token: "asdasdasdasd",
      },
    );

    assert.deepEqual(results, []);
    assert(
      errors.map((error) => error.message).includes("duplicated-account-error"),
    );
  });

  it("[defcbb11] should be able to get assets report", async () => {
    const application = {
      id: "root-123",
      applicants: [
        { id: "123", details: { financialAccounts: financialAccountsMock } },
      ],
    };
    mock.reset();
    const response = await client.createAssetsReport(
      context,
      application,
      "123",
      {
        access_token: "asasdasdasd",
        days_requested: 60,
      },
    );
    assert.deepEqual(
      response,
      "assets-sandbox-6f12f5bb-22dd-4855-b918-f47ec439198a",
    );
  });

  it("[fc99df78] shuould be able to create a relay token", async () => {
    const application = {
      id: "root-123",
      applicants: [
        { id: "123", details: { financialAccounts: financialAccountsMock } },
      ],
    };
    mock.reset();
    const response = await client.createRelayToken(
      context,
      application,
      "123",
      {
        access_token: "asasdasdasd",
      },
    );
    assert.deepEqual(
      response,
      "credit-relay-production-3TAU2CWVYBDVRHUCAAAI27ULU4",
    );
  });
});
