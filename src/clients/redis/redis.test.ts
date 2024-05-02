import { describe, it, before, mock, after } from "node:test";
import assert from "node:assert";

import createPluginContext from "@earnest-labs/microservice-chassis/createPluginContext.js";

import readJsonFile from "@earnest-labs/microservice-chassis/readJsonFile.js";
import RedisClient from "./index.js";

describe("[61b95acc] Volatile Storage Client", () => {
  let context;
  let client: RedisClient;

  before(async () => {
    const pkg = await readJsonFile("./package.json");
    pkg.logging = { level: "error" };

    context = await createPluginContext(pkg);

    client = new RedisClient(context);
    await client.connect(context);
  });
  after(async () => {
    client.disconnect();
  });
  it("[b026639e] should be able to getApplicationState", async () => {
    const state = {
      manifest: "test",
      step: "test",
    };
    mock.method(client.client, "get", async () => {
      return JSON.stringify(state);
    });
    const response = await client.getApplicationState(context, "1", {});
    assert.deepEqual(response, state);
  });
  it("[8213e2fe] getApplicationState should return null when empty", async () => {
    mock.method(client.client, "get", async () => {
      return undefined;
    });
    const response = await client.getApplicationState(context, "1", {});
    assert.deepEqual(response, {});
  });
  it("[dd21fcdc] should be able to setApplicationState", async () => {
    const state = {
      manifest: "test",
      step: "test",
    };
    mock.method(client.client, "set", async () => {
      return "OK";
    });
    const response = await client.setApplicationState(context, "1", state);
    assert.deepEqual(response, "OK");
  });
  it("[133dcab6] should be able to getUserState", async () => {
    const state = {
      testProperty: true,
    };
    mock.method(client.client, "get", async () => {
      return JSON.stringify(state);
    });
    const response = await client.getUserState(context, "1", {});
    assert.deepEqual(response, state);
  });
  it("[20ad3932] should be able to setUserState", async () => {
    const state = {
      testProperty: true,
    };
    mock.method(client.client, "set", async () => {
      return "OK";
    });
    const response = await client.setUserState(context, "1", state);
    assert.deepEqual(response, "OK");
  });
});
