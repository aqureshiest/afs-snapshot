import { describe, it, before, after } from "node:test";

import axios from "axios";

import createPluginContext from "@earnest-labs/microservice-chassis/createPluginContext.js";
import registerChassisPlugins from "@earnest-labs/microservice-chassis/registerChassisPlugins.js";
import readJsonFile from "@earnest-labs/microservice-chassis/readJsonFile.js";

describe("[41a1abef] chassis-plugins", () => {
  let context: Context;

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

  it("[9c34ea12] Representative contracts", async () => {
    await axios.get("http://localhost:3000/apply/nested/nested_manifest");
  });

  it("[ac8836e7] Representative contracts", async () => {
    await axios.post("http://localhost:3000/apply/nested/nested_manifest");
  });
});
