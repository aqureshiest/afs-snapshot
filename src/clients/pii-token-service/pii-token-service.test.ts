import { describe, it, before } from "node:test";
import assert from "node:assert";

import createPluginContext from "@earnest-labs/microservice-chassis/createPluginContext.js";
import registerChassisPlugins from "@earnest-labs/microservice-chassis/registerChassisPlugins.js";
import readJsonFile from "@earnest-labs/microservice-chassis/readJsonFile.js";
import PiiTokenServiceClient from "./index.js";

describe("[d32a4d27] PII Token Service Client", () => {
  let context;
  let client: PiiTokenServiceClient;

  before(async () => {
    const pkg = await readJsonFile("./package.json");
    pkg.logging = { level: "error" };

    context = await createPluginContext(pkg);
    await registerChassisPlugins(context);
    client = context.loadedPlugins.piiTokenService.instance;
  });

  it("[94cfc052] Should be able to obtain SSN from Token", async () => {
    const token = "pii-token://tokens/f0cc1999-8704-4498-bb00-9f65a7d00063";
    const response = await client.getTokenValue(token);
    assert.equal(response, "999999999");
  });

  it("[f92cd5f3] Should return uri token when given SSN", async () => {
    const response = await client.saveToken("123456789");
    assert(response);
    assert.equal(
      response,
      "pii-token://tokens/36db231d-4151-42e4-9a28-4d3d3d3",
    );
  });
});
