import { describe, it, before, beforeEach, after, mock } from "node:test";
import assert from "node:assert";
import axios from "axios";

import createPluginContext from "@earnest-labs/microservice-chassis/createPluginContext.js";
import registerChassisPlugins from "@earnest-labs/microservice-chassis/registerChassisPlugins.js";
import readJsonFile from "@earnest-labs/microservice-chassis/readJsonFile.js";
import ApplicationServiceClient from "../clients/application-service/index.js";

describe("[41a1abef] chassis-plugins", () => {
  let context: Context;

  beforeEach(() => {
    mock.method(ApplicationServiceClient.prototype, "post", async () => {
      return {
        response: {
          statusCode: 200,
        },
        results: {
          data: { createApplication: { id: "08594f80" } },
          errors: [],
        },
      };
    });
  });

  before(async () => {
    const pkg = await readJsonFile("./package.json");
    pkg.logging = { level: "error" };
    context = await createPluginContext(pkg);
    await registerChassisPlugins(context);
    await context.applicationServer.listen(3000);
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
    const request = axios.get(
      "http://localhost:3000/apply/nested/nested_manifest",
    );
    return assert.doesNotReject(request);
  });

  it("[ac8836e7] Mutative contracts", async () => {
    const request = axios.post(
      "http://localhost:3000/apply/nested/nested_manifest",
    );
    return assert.doesNotReject(request);
  });
});
