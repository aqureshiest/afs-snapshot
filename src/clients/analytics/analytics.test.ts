// import { describe, it, before, mock } from "node:test";
// import assert from "node:assert";

// import createPluginContext from "@earnest-labs/microservice-chassis/createPluginContext.js";
// import registerChassisPlugins from "@earnest-labs/microservice-chassis/registerChassisPlugins.js";
// import readJsonFile from "@earnest-labs/microservice-chassis/readJsonFile.js";
// import AnalyticsServiceClient from "./index.js";
// import { ApplicationSectionStartedTrackParams } from "./types.js";

// describe("[d32a4d27] PII Token Service Client", () => {
//   let context;
//   let client: AnalyticsServiceClient;

//   before(async () => {
//     const pkg = await readJsonFile("./package.json");
//     pkg.logging = { level: "error" };

//     context = await createPluginContext(pkg);
//     await registerChassisPlugins(context);
//     console.log(context.loadedPlugins);

//     client = context.loadedPlugins.analyticsServiceClient.instance;
//   });

//   describe("[03df6e1e] PII Token Service Client Error tests", () => {
//     it("[ba730b42] Should throw an error on GET when no token given", async () => {
//       try {
//         const props:ApplicationSectionStartedTrackParams = ;
//         await client.trackApplicationSectionStarted("");
//       } catch (error) {
//         assert.strictEqual(error.message, "[9cfa7507] Token is required.");
//       }
//     });

//   });
// });
