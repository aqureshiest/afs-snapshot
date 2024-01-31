import { describe, it } from "node:test";

import createPluginContext from "@earnest-labs/microservice-chassis/createPluginContext.js";
import registerChassisPlugins from "@earnest-labs/microservice-chassis/registerChassisPlugins.js";
import readJsonFile from "@earnest-labs/microservice-chassis/readJsonFile.js";

describe("[63d13174] chassis-plugins", () => {
  it("[88090fb9] registers without error", async () => {
    const pkg = await readJsonFile("./package.json");
    pkg.logging = { level: "error" };
    const context = await createPluginContext(pkg);
    await registerChassisPlugins(context);
  });
});
