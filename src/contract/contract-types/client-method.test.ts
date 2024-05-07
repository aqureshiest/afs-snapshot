import { before, describe, it, mock } from "node:test";
import assert from "node:assert";

import createPluginContext from "@earnest-labs/microservice-chassis/createPluginContext.js";
import registerChassisPlugins from "@earnest-labs/microservice-chassis/registerChassisPlugins.js";
import readJsonFile from "@earnest-labs/microservice-chassis/readJsonFile.js";

import Contract from "../contract.js";
import Manifest from "../manifest.js";

describe("[9a0b9d5e] Contract: ClientMethod", () => {
  let context;

  before(async () => {
    const pkg = await readJsonFile("./package.json");
    pkg.logging = { level: "error" };
    context = await createPluginContext(pkg);
    await registerChassisPlugins(context);
  });

  it("[4467ca51] calls the specified client", async () => {
    const MOCKED_RESPONSE = "pong";

    const input = {} as Input;
    const manifest = new Manifest(context, "manifestTest", {
      "*": new Contract({
        type: "clientMethod",
        raw: JSON.stringify({
          client: "internalRestServiceClient",
          method: "GET",
          uri: "/ping",
        }),
      }),
    });

    mock.method(
      context.loadedPlugins.internalRestServiceClient.instance,
      "request",
      async () => {
        return { response: { statusCode: 200 }, results: MOCKED_RESPONSE };
      },
    );

    const { contract } = await manifest.execute(input, { context, ...input });

    const parsed = JSON.parse(JSON.stringify(contract));

    assert.equal(parsed, MOCKED_RESPONSE);
  });

  it("[000fd623] quietly ignores non-allow-listed clients", async () => {
    const MOCKED_RESPONSE = "pong";

    const input = {} as Input;
    const manifest = new Manifest(context, "manifestTest", {
      "*": new Contract({
        type: "clientMethod",
        raw: JSON.stringify({
          client: "sneakyInternalClient",
          method: "GET",
          uri: "/ping",
        }),
      }),
    });

    mock.method(
      context.loadedPlugins.internalRestServiceClient.instance,
      "request",
      async () => {
        return { response: { statusCode: 200 }, results: MOCKED_RESPONSE };
      },
    );

    const { contract } = await manifest.execute(input, { context, ...input });

    const parsed = JSON.parse(JSON.stringify(contract));

    assert.equal(parsed, null);
  });
});
