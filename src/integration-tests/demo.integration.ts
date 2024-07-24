import { describe, it } from "node:test";
import assert from "node:assert";
import { Client } from "@earnest/http";

describe("test ping", () => {
  it("[get /ping", async () => {
    const afsClient = new Client({
      baseUrl: "https://apply-flow-service.staging.earnest.com"
    });
    const { response } = await afsClient.get({
      uri: "/ping",
      headers: {
        tracestate: process.env.TRACESTATE || "",
      },
    })
    assert.equal(response.statusCode, 200);
  });
});
