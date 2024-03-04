import { describe, it, before, mock } from "node:test";
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

  describe("[03df6e1e] PII Token Service Client Error tests", () => {
    it("[ba730b42] Should throw an error on GET when no token given", async () => {
      try {
        await client.getTokenValue("");
      } catch (error) {
        assert.strictEqual(error.message, "[9cfa7507] Token is required.");
      }
    });

    it("[975aa430] Should throw an error on GET response", async () => {
      const token = "pii-token://tokens/f0cc1999-8704-4498-bb00-9f65a7d00063";
      mock.method(client, "get", async () => {
        return {
          response: {
            statusCode: 400,
            statusMessage: "Error getting token",
          },
        };
      });
      try {
        await client.getTokenValue(token);
      } catch (error) {
        assert.strictEqual(
          error.message,
          "[6d12a0cf] getTokenValue failed with response code: 400",
        );
      }
      mock.reset();
    });

    it("[9a6a892e] Should throw an error on POST when no SSN value is given", async () => {
      try {
        await client.saveToken("");
      } catch (error) {
        assert.strictEqual(error.message, "[7adfc728] Value is required.");
      }
    });

    it("[8e391c37] Should throw an error on Post response", async () => {
      mock.method(client, "post", async () => {
        return {
          response: {
            statusCode: 400,
            statusMessage: "Error saving token",
          },
        };
      });
      try {
        await client.saveToken("123456789");
      } catch (error) {
        assert.strictEqual(
          error.message,
          "[ec3424f2] saveToken failed with response code: 400",
        );
      }
      mock.reset();
    });
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
