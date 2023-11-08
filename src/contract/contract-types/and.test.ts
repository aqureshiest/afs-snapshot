import { describe, it } from "node:test";
import assert from "node:assert";

import contractExecutor from "../contract-executor.js";

describe("[76c2914a] AndContract", () => {
  it("[17137eb7] Returns the last non-falsy value", async () => {
    const input = {} as Input;
    const manifest: Manifest = {
      "*": {
        type: "identity",
        definition: JSON.stringify({
          coercion: "string",
          $AND: [1, "text", true],
        }),
      },
    };

    const { contract } = contractExecutor(input, manifest);
    assert.equal(contract, "true");
  });

  it("[39ede471] Coerces a truthy value to a number", async () => {
    const input = {} as Input;
    const manifest: Manifest = {
      "*": {
        type: "identity",
        definition: JSON.stringify({
          coercion: "number",
          $AND: [1, "text", true],
        }),
      },
    };

    const { contract } = contractExecutor(input, manifest);
    assert.equal(contract, 1);
  });

  it("[39ede471] Coerces a falsy value to a number", async () => {
    const input = {} as Input;
    const manifest: Manifest = {
      "*": {
        type: "identity",
        definition: JSON.stringify({
          coercion: "number",
          $AND: [1, "text", false],
        }),
      },
    };

    const { contract } = contractExecutor(input, manifest);
    assert.equal(contract, 0);
  });

  it("[40952105] Can coerce a number to a number", async () => {
    const input = {} as Input;
    const manifest: Manifest = {
      "*": {
        type: "identity",
        definition: JSON.stringify({
          coercion: "number",
          $AND: [1, 123, 414],
        }),
      },
    };

    const { contract } = contractExecutor(input, manifest);
    assert.equal(contract, 414);
  });

  it("[96fc063d] Can coerce a string to a string", async () => {
    const input = {} as Input;
    const manifest: Manifest = {
      "*": {
        type: "identity",
        definition: JSON.stringify({
          coercion: "string",
          $AND: ["this", "and", "that"],
        }),
      },
    };

    const { contract } = contractExecutor(input, manifest);
    assert.equal(contract, "that");
  });

  it("[78a152fe] Handles a single value", async () => {
    const input = {} as Input;
    const manifest: Manifest = {
      "*": {
        type: "identity",
        definition: JSON.stringify({
          coercion: "string",
          $AND: "that",
        }),
      },
    };

    const { contract } = contractExecutor(input, manifest);
    assert.equal(contract, "that");
  });

  it("[80706ba5] Handles an empty array", async () => {
    const input = {} as Input;
    const manifest: Manifest = {
      "*": {
        type: "identity",
        definition: JSON.stringify({
          $AND: [],
        }),
      },
    };

    const { contract } = contractExecutor(input, manifest);
    assert.equal(contract, true);
  });

  it("[c5e321d3] Can coerce an empty array", async () => {
    const input = {} as Input;
    const manifest: Manifest = {
      "*": {
        type: "identity",
        definition: JSON.stringify({
          coercion: "number",
          $AND: [],
        }),
      },
    };

    const { contract } = contractExecutor(input, manifest);
    assert.equal(contract, 1);
  });
});
