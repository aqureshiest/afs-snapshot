import { describe, it, before, mock } from "node:test";
import assert from "node:assert";

import createPluginContext from "@earnest-labs/microservice-chassis/createPluginContext.js";
import registerChassisPlugins from "@earnest-labs/microservice-chassis/registerChassisPlugins.js";
import readJsonFile from "@earnest-labs/microservice-chassis/readJsonFile.js";
import AccreditedSchoolServiceClient from "./index.js";
import { Input as IContractInput } from "contract/manifest.js";

describe("[f8395630] Application Service Client", () => {
  let context;
  let client: AccreditedSchoolServiceClient;
  const input = {
    application: null,
    request: {},
  } as unknown as IContractInput;

  before(async () => {
    const pkg = await readJsonFile("./package.json");
    pkg.logging = { level: "error" };

    context = await createPluginContext(pkg);
    await registerChassisPlugins(context);
    client = context.loadedPlugins.accreditedSchoolService.instance;
  });

  it("[ad0e89fe] should be able to get a list of schools", async () => {
    const response = await client.getSchools(input, context, {
      loanType: "slo",
      name: "berkeley",
    });
    assert.deepStrictEqual(
      response[0].name,
      "University of California, Berkeley",
    );
  });

  it("[b6fa8369] should be able to get school data from id", async () => {
    const response = await client.getSchool(input, context, { id: "00732978" });
    assert(response);
    assert.deepStrictEqual(response.name, "ITT Technical Institute - Corona");
  });

  it("[b6fa8269] should be able to get school data from opeidid", async () => {
    const response = await client.getSchoolByOpeid(input, context, {
      opeid: "00732978",
    });
    assert(response);
    assert.deepStrictEqual(response.name, "University of California, Berkeley");
  });

  it("[b6fg9269] should be able to get school name from opeidid", async () => {
    const response = await client.getSchoolName(input, context, {
      opeid: "00732978",
    });
    assert(response);
    assert.deepStrictEqual(response, "University of California, Berkeley");
  });

  it("[0743446b] should get error when >=400", async () => {
    mock.method(client, "get", async () => {
      return {
        response: {
          statusCode: 400,
          statusMessage: "invalid request",
        },
      };
    });
    const request = client.getSchools(input, context, {
      name: "nada",
    });
    assert.rejects(request);
  });
  it("[8208a473] should get 404 when id not found", async () => {
    mock.method(client, "get", async () => {
      return {
        response: {
          statusCode: 404,
          statusMessage: "not found",
        },
      };
    });
    const request = await client.getSchool(input, context, { id: "404" });
    assert.equal(request, null);
  });
  it("[8a10561b] should get error when >=400", async () => {
    mock.method(client, "get", async () => {
      return {
        response: {
          statusCode: 400,
          statusMessage: "invalid request",
        },
      };
    });
    const request = client.getSchool(input, context, { id: "404" });
    assert.rejects(request);
  });
});
