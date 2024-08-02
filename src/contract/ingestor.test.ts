import assert from "node:assert";
import { describe, it, before } from "node:test";

import createPluginContext from "@earnest-labs/microservice-chassis/createPluginContext.js";
import readJsonFile from "@earnest-labs/microservice-chassis/readJsonFile.js";
import registerChassisPlugins from "@earnest-labs/microservice-chassis/registerChassisPlugins.js";

import ingestManifests, { buildManifests, buildContracts } from "./ingestor.js";

describe("[6bb0091c] ingestor", () => {
  let context;
  before(async () => {
    const pkg = await readJsonFile("./package.json");
    pkg.logging = { level: "fatal" };
    context = await createPluginContext(pkg);
    await registerChassisPlugins(context);
  });

  it("[7c11f0d7] runs without error", async () => {
    const { contracts, manifests } = await ingestManifests(context);
    assert(contracts, "[ff79e18b] missing contracts");
    assert(manifests, "[ff79e18b] missing contracts");
  });

  it("[bbe0fb12] handles various contract error conditions", async () => {
    await assert.doesNotReject(
      buildContracts(context, "flows/contracts_invalid"),
    );
  });

  it("[1e3dea67] handles various manifest error conditions", async () => {
    const contracts = await buildContracts(context, "flows/contracts_invalid");
    await assert.doesNotReject(
      buildManifests(context, "flows/manifests_invalid", contracts),
    );
  });

  it("[04deadd0] finds deeply nested manifests", async () => {
    const contracts = await buildContracts(context, "flows/contracts");
    await assert.doesNotReject(
      buildManifests(context, "flows/manifests", contracts),
    );
  });
});
