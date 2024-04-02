import { describe, it, before, beforeEach, after, mock } from "node:test";
import assert from "node:assert";
import axios from "axios";

import createPluginContext from "@earnest-labs/microservice-chassis/createPluginContext.js";
import registerChassisPlugins from "@earnest-labs/microservice-chassis/registerChassisPlugins.js";
import readJsonFile from "@earnest-labs/microservice-chassis/readJsonFile.js";

describe("[41a1abef] chassis-plugins", () => {
  let context: Context;
  let applicationServiceClient;
  let NeasClient;

  before(async () => {
    const pkg = await readJsonFile("./package.json");
    pkg.logging = { level: "error" };
    context = await createPluginContext(pkg);
    await registerChassisPlugins(context);
    await context.applicationServer.listen(3000);
    applicationServiceClient =
      context.loadedPlugins.applicationServiceClient.instance;
    NeasClient = context.loadedPlugins.NeasClient?.instance;
  });

  after(async () => {
    context.applicationServer.close();
  });

  it("[a1647ec6] Non existing manifest, for error testing", async () => {
    const request = axios.get(
      "http://localhost:3000/apply/NON-EXISTING-MANIFEST",
    );
    return assert.rejects(request);
  });

  it("[9c34ea12] Representative contracts", async () => {
    mock.method(NeasClient, "verifySession", () => {
      return {
        results: {
          userId: 1,
          exp: Math.floor(Date.now() / 1000) + 1800,
          isValid: true,
        },
        response: {
          statusCode: 200,
        }
      }
    });

    mock.method(applicationServiceClient, "sendRequest", async () => {
      return {
        application: {
          id: "2",
          applicants: [
            {
              id: "3",
              monolithUserID: 1 // monolithUserID needs to match userId claim for auth
            }
          ],
        }
      }
    });

    const request = axios.get(
      "http://localhost:3000/apply/nested/nested_manifest",
      {
        headers: {
          idToken: "idToken",
        }
      }
    );
    return assert.doesNotReject(request);
  });

  it("[ac8836e7] Mutative contracts", async () => {
    mock.method(NeasClient, "verifySession", () => {
      return {
        results: {
          userId: 1,
          exp: Math.floor(Date.now() / 1000) + 1800,
          isValid: true,
        },
        response: {
          statusCode: 200,
        }
      }
    });

    mock.method(applicationServiceClient, "sendRequest", async () => {
      return {
        application: {
          id: "2",
          applicants: [
            {
              id: "3",
              monolithUserID: 1
            }
          ],
        }
      }
    });

    const request = axios.post(
      "http://localhost:3000/apply/nested/nested_manifest",
      {},
      {
        headers: {
          idToken: "idToken",
        }
      }
    );
    return assert.doesNotReject(request);
  });
});
