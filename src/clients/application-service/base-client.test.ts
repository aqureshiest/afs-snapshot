import { before, describe, it } from "node:test";
import assert from "node:assert";

import createPluginContext from "@earnest-labs/microservice-chassis/createPluginContext.js";
import registerChassisPlugins from "@earnest-labs/microservice-chassis/registerChassisPlugins.js";
import readJsonFile from "@earnest-labs/microservice-chassis/readJsonFile.js";
import SensitiveString from "@earnest-labs/ts-sensitivestring";

import BaseClient from "./base-client.js";

describe("[d7c20b00] base-client for application-service-client", () => {
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
    client = new BaseClient({ baseUrl, accessKey }, context);
  });

  it("[28e9dd46] should instantiate the BaseClient", async () => {
    assert(client);
  });

  it("[b707124d] should log at a given logging level", () => {
    assert.doesNotThrow(() => client.log("message", "error"));
  });

  it("[d6a8429b] should log at the info level by default", () => {
    assert.doesNotThrow(() => client.log("message"));
  });
});
