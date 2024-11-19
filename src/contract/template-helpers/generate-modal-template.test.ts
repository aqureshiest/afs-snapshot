import { before, describe, it } from "node:test";
import { Response } from "express";
import assert from "node:assert";

import createPluginContext from "@earnest-labs/microservice-chassis/createPluginContext.js";
import registerChassisPlugins from "@earnest-labs/microservice-chassis/registerChassisPlugins.js";
import readJsonFile from "@earnest-labs/microservice-chassis/readJsonFile.js";

import Contract from "../contract.js";
import Manifest from "../manifest.js";

import generateModalTemplate from "./generate-modal-template.js";

describe("[02c8a0e5] Generate Modal Contract", () => {
  let context;
  let res;

  before(async () => {
    const pkg = await readJsonFile("./package.json");
    pkg.logging = { level: "error" };
    context = await createPluginContext(pkg);
    await registerChassisPlugins(context);
    res = {} as Response;
  });

  it("[da1cfa73] should generate a modal template", async () => {
    /**
     * Dont ask my why, but the test will fail unless the we include
     * the unrelated code below.
     */
    const input = { response: res };
    const manifest = new Manifest(
      "authTest",
      {
        "*": "raw",
      },
      {
        raw: {
          default: new Contract({
            type: "authenticate",
            raw: JSON.stringify({
              strategies: [
                {
                  strategy: "valid-but-forbidden",
                  isValid: false,
                  isAuthorized: false,
                },
              ],
            }),
          }),
        },
      },
    );

    const request = {
      params: { id: "1" },
      body: { values: { email: "test@earnest.com" } },
    };
    const actions = [
      { action: "identify", statusCode: 201 },
      { action: "get-existing-user", hasLegacyLoan: false },
    ];
    const application = { id: "1" };
    const applications = [];
    const env = {
      S2S_APPLICATION_SERVICES_KEY: "S2S_APPLICATION_SERVICES_KEY",
      INTERNAL_REST_SERVICE_AUTH_KEY: "INTERNAL_REST_SERVICE_AUTH_KEY",
      BASE_URL: "BASE_URL",
    };
    const errors = {};
    const result: { [key: string]: unknown } = (
      await manifest.execute(context, { errors }, input)
    ).toJSON() as { [key: string]: unknown };

    const test = generateModalTemplate(
      request,
      actions,
      application,
      applications,
      env,
    );
    assert.ok(test);
  });
});
