import { describe, it, after } from "node:test";

import createPluginContext from "@earnest-labs/microservice-chassis/createPluginContext.js";
import registerChassisPlugins from "@earnest-labs/microservice-chassis/registerChassisPlugins.js";
import readJsonFile from "@earnest-labs/microservice-chassis/readJsonFile.js";
import { plugin as knexPlugin } from "@earnest-labs/microservice-chassis-knex/knex.chassis-plugin.js";

describe("[41a1abef] chassis-plugins", () => {
  after(async () => {
    const knex = knexPlugin.connections.get("DEFAULT");
    if (knex) return knex.destroy();
  });
  it("[88090fb9] registers without error", async () => {
    const pkg = await readJsonFile("./package.json");
    pkg.logging = { level: "error" };
    const context = await createPluginContext(pkg);
    await registerChassisPlugins(context);
  });
});
