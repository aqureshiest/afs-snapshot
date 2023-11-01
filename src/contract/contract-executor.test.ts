import { describe, it } from "node:test";
import assert from "node:assert";

import contractExecutor from "./contract-executor.js";

describe("[462fd166] contractExecutor", () => {
  it("[be92134e] runs without error", async () => {
    const input = {};
    const manifest: Manifest = {
      "*": { type: "identity", definition: JSON.stringify({}) },
    };

    const contract = await contractExecutor(input, manifest);
    assert(contract);
  });

  it("[d21960f7] maps a contract to the root", async () => {
    const TEST_STRING = "test";

    const input = {};
    const manifest: Manifest = {
      "*": { type: "identity", definition: JSON.stringify({ $: "mapped" }) },
      mapped: [{ type: "string", definition: JSON.stringify(TEST_STRING) }],
    };

    const contract = await contractExecutor(input, manifest);
    assert.equal(contract, TEST_STRING);
  });

  it("[614d7fb0] maps a contract to the root and coerces it", async () => {
    const TEST_STRING = "test";

    const input = {};
    const manifest: Manifest = {
      "*": {
        type: "identity",
        definition: JSON.stringify({ $: "mapped::boolean" }),
      },
      mapped: [{ type: "string", definition: JSON.stringify(TEST_STRING) }],
    };

    const contract = await contractExecutor(input, manifest);
    assert.equal(contract, true);
  });

  it("[aab458ae] can execute arbitrary embedded contracts", async () => {
    const TEST_STRINGS = ["this ", "is ", "a ", "test"];

    const input = {};
    const manifest: Manifest = {
      "*": {
        type: "identity",
        definition: JSON.stringify({ "@": "identity", $: TEST_STRINGS }),
      },
    };

    const contract = await contractExecutor(input, manifest);
    assert.deepEqual(contract, TEST_STRINGS);
  });

  it("[4cc777bd] maps an input value to the root", async () => {
    const TEST_STRING = "test";
    const input = {
      request: {
        body: {
          foo: TEST_STRING,
        },
      },
    };
    const manifest: Manifest = {
      "*": {
        type: "identity",
        definition: JSON.stringify({ "#": "request.body.foo" }),
      },
    };

    const contract = await contractExecutor(input, manifest);
    assert.equal(contract, TEST_STRING);
  });

  it("[0116aeda] maps an input value array to the root", async () => {
    const TEST_BODY = [{ foo: "test_1" }, { foo: "test_2" }, { foo: "test_3" }];
    const input = {
      request: {
        body: TEST_BODY,
      },
    };
    const manifest: Manifest = {
      "*": {
        type: "identity",
        definition: JSON.stringify({ "#": "request.body.*.foo" }),
      },
    };

    const contract = await contractExecutor(input, manifest);
    assert.deepEqual(contract, ["test_1", "test_2", "test_3"]);
  });

  it("[40533382] concatenates strings", async () => {
    const TEST_STRINGS = ["this ", "is ", "a ", "test"];
    const input = {};
    const manifest: Manifest = {
      "*": {
        type: "identity",
        definition: JSON.stringify({ "&": TEST_STRINGS }),
      },
    };

    const contract = await contractExecutor(input, manifest);
    assert.equal(contract, TEST_STRINGS.join(""));
  });

  it("[ddcc668c] concatenates arrays", async () => {
    const TEST_STRINGS = ["this ", "is ", "a "];
    const NESTED_STRINGS = ["nested ", "string ", "example "];
    const input = {};
    const manifest: Manifest = {
      "*": {
        type: "identity",
        definition: JSON.stringify({ "&": [...TEST_STRINGS, NESTED_STRINGS] }),
      },
    };

    const contract = await contractExecutor(input, manifest);
    assert.deepEqual(contract, [...TEST_STRINGS, ...NESTED_STRINGS]);
  });

  it("[f7ee9846] operations", async () => {
    const PARAMETER = 256;

    const input = {
      request: {
        body: {
          foo: 2048,
        },
      },
    };
    const manifest: Manifest = {
      "*": {
        type: "identity",
        definition: JSON.stringify({
          "%": [PARAMETER, "+", { "#": "request.body.foo" }],
        }),
      },
    };

    const contract = await contractExecutor(input, manifest);
    assert.equal(contract, PARAMETER + input.request.body.foo);
  });
});
