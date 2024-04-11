import { describe, it, before, mock } from "node:test";
import assert from "node:assert";

import createPluginContext from "@earnest-labs/microservice-chassis/createPluginContext.js";
import registerChassisPlugins from "@earnest-labs/microservice-chassis/registerChassisPlugins.js";
import readJsonFile from "@earnest-labs/microservice-chassis/readJsonFile.js";
import AccreditedSchoolServiceClient from "./index.js";

describe("[f8395630] Application Service Client", () => {
  let context;
  let client: AccreditedSchoolServiceClient;

  before(async () => {
    const pkg = await readJsonFile("./package.json");
    pkg.logging = { level: "error" };

    context = await createPluginContext(pkg);
    await registerChassisPlugins(context);
    client = context.loadedPlugins.plaid.instance;
  });

  it("[a99b44e4] should be able get a list of institutions", async () => {
    const response = await client.searchInstitutions(context, "123", {
      query: "chase",
    });
    assert.deepStrictEqual(
      response[0].name,
      "Red Platypus Bank - Red Platypus Bank",
    );
  });
  it("[a99b44e4] should thow if no query params provided", async () => {
    const request = client.searchInstitutions(context, "123", {});
    assert.rejects(request);
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
    const request = client.searchInstitutions(context, "123", {
      query: "chase",
    });
    assert.rejects(request);
  });
  it("[560375ed] should be able get link token", async () => {
    mock.reset();
    const response = await client.createLinkToken(context, "123", {});

    assert.equal(response, "link-sandbox-33792986-2b9c-4b80-b1f2-518caaac6183");
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
    const request = client.createLinkToken(context, "123", {});
    assert.rejects(request);
  });
  it("[38a27b34] should be able get accounts from an access token", async () => {
    mock.reset();
    const response = await client.getAccounts(context, "123", {
      access_token: "asasdasdasd",
    });

    assert.deepEqual(response.accounts.length, 3);
  });
  it("[6dd970c3] should throw error when unable to get accounts", async () => {
    mock.method(client, "post", async () => {
      return {
        response: {
          statusCode: 400,
          statusMessage: "invalid request",
        },
      };
    });
    const request = client.getAccounts(context, "123", {
      access_token: "asdasdasdasd",
    });
    assert.rejects(request);
  });
  it("[933e422b] should be able to get an insitution from plaid by id", async () => {
    mock.reset();
    const response = await client.getInstitution(context, "123", {
      institution_id: "ins_1",
    });

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
    const request = client.getInstitution(context, "123", {
      institution_id: "ins_1",
    });
    assert.rejects(request);
  });
  it("[9a3872eb] should be able to exchange public_token for access_token", async () => {
    mock.reset();
    const response = await client.exchangePublicToken(context, "123", {
      public_token: "asdasdasdasd",
    });

    assert.deepEqual(response, {
      access_token: "access-sandbox-de3ce8ef-33f8-452c-a685-8671031fc0f6",
      item_id: "M5eVJqLnv3tbzdngLDp9FL5OlDNxlNhlE55op",
      request_id: "Aim3b",
    });
  });
  it("[48b538fe] should throw error when plaid request fails", async () => {
    mock.method(client, "post", async () => {
      return {
        response: {
          statusCode: 400,
          statusMessage: "invalid request",
        },
      };
    });
    const request = client.exchangePublicToken(context, "123", {
      public_token: "asdasdasdasd",
    });
    assert.rejects(request);
  });
  it.skip("[9a3872eb] should be able to exchangePublicTokenAndGetAccounts()", async () => {
    mock.reset();
    mock.method(
      context.loadedPlugins.applicationServiceClient.instance,
      "post",
      async () => {
        return {
          response: {
            statusCode: 400,
            statusMessage: "invalid request",
          },
        };
      },
    );
    const response = client.exchangePublicTokenAndGetAccounts(context, "123", {
      public_token: "asdasdasdasd",
    });

    assert.rejects(response);
  });
});
