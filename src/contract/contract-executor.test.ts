import { describe, it } from "node:test";
import assert from "node:assert";

import contractExecutor from "./contract-executor.js";

describe("[462fd166] contractExecutor", () => {
  it("[be92134e] runs without error", async () => {
    const input = {} as Input;
    const manifest: Manifest = {
      "*": { type: "identity", definition: JSON.stringify({}) },
    };

    const { contract } = contractExecutor(input, manifest);
    assert(contract);
  });

  it("[d21960f7] maps a contract to the root", async () => {
    const TEST_STRING = "test";

    const input = {} as Input;
    const manifest: Manifest = {
      "*": { type: "identity", definition: JSON.stringify({ $: "mapped" }) },
      mapped: [{ type: "string", definition: JSON.stringify(TEST_STRING) }],
    };

    const { contract } = contractExecutor(input, manifest);
    assert.equal(contract, TEST_STRING);
  });

  it("[614d7fb0] maps a contract to the root and coerces it", async () => {
    const TEST_STRING = "test";

    const input = {} as Input;
    const manifest: Manifest = {
      "*": {
        type: "identity",
        definition: JSON.stringify({ $: "mapped::boolean" }),
      },
      mapped: [{ type: "string", definition: JSON.stringify(TEST_STRING) }],
    };

    const { contract } = contractExecutor(input, manifest);
    assert.equal(contract, true);
  });

  it("[aab458ae] can execute arbitrary embedded contracts", async () => {
    const TEST_STRINGS = ["this ", "is ", "a ", "test"];

    const input = {} as Input;
    const manifest: Manifest = {
      "*": {
        type: "identity",
        definition: JSON.stringify({ "@": "identity", $: TEST_STRINGS }),
      },
    };

    const { contract } = contractExecutor(input, manifest);
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
    } as Input;
    const manifest: Manifest = {
      "*": {
        type: "identity",
        definition: JSON.stringify({ "#": "request.body.foo" }),
      },
    };

    const { contract } = contractExecutor(input, manifest);
    assert.equal(contract, TEST_STRING);
  });

  it("[0116aeda] maps an input value array to the root", async () => {
    const TEST_BODY = [{ foo: "test_1" }, { foo: "test_2" }, { foo: "test_3" }];
    const input = {
      request: {
        body: TEST_BODY,
      },
    } as Input;
    const manifest: Manifest = {
      "*": {
        type: "identity",
        definition: JSON.stringify({ "#": "request.body.*.foo" }),
      },
    };

    const { contract } = contractExecutor(input, manifest);
    assert.deepEqual(contract, ["test_1", "test_2", "test_3"]);
  });

  it("[40533382] concatenates strings", async () => {
    const TEST_STRINGS = ["this ", "is ", "a ", "test"];
    const input = {} as Input;
    const manifest: Manifest = {
      "*": {
        type: "identity",
        definition: JSON.stringify({ "&": TEST_STRINGS }),
      },
    };

    const { contract } = contractExecutor(input, manifest);
    assert.equal(contract, TEST_STRINGS.join(""));
  });

  it("[ddcc668c] concatenates arrays", async () => {
    const TEST_STRINGS = ["this ", "is ", "a "];
    const NESTED_STRINGS = ["nested ", "string ", "example "];
    const input = {} as Input;
    const manifest: Manifest = {
      "*": {
        type: "identity",
        definition: JSON.stringify({ "&": [...TEST_STRINGS, NESTED_STRINGS] }),
      },
    };

    const { contract } = contractExecutor(input, manifest);
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
    } as Input;
    const manifest: Manifest = {
      "*": {
        type: "identity",
        definition: JSON.stringify({
          "%": [PARAMETER, "+", { "#": "request.body.foo" }],
        }),
      },
    };

    const { contract } = contractExecutor(input, manifest);
    assert.equal(contract, PARAMETER + input.request.body.foo);
  });

  it("[a5701098] mutation contracts", async () => {
    const input = {} as Input;
    const manifest: Manifest = {
      "*": [
        {
          type: "applicationEvent",
          definition: JSON.stringify({
            event: "addDetails",
          }),
        },
        {
          type: "applicationEvent",
          definition: JSON.stringify({
            event: "information",
          }),
        },
      ],
    };

    const { mutations } = contractExecutor(input, manifest);
    assert.notEqual(mutations.length, 0);
  });

  describe("[2e57cb55] NotContract", () => {
    it("[d8240749] Negates the value as a string", async () => {
      const input = {} as Input;
      const manifest: Manifest = {
        "*": {
          type: "identity",
          definition: JSON.stringify({
            coercion: "string",
            $NOT: 0,
          }),
        },
      };

      const { contract } = contractExecutor(input, manifest);
      assert.equal(contract, "yes");
    });

    it("[65f0ade7] Coerces to a number", async () => {
      const input = {} as Input;
      const manifest: Manifest = {
        "*": {
          type: "identity",
          definition: JSON.stringify({
            coercion: "number",
            $NOT: true,
          }),
        },
      };

      const { contract } = contractExecutor(input, manifest);
      assert.equal(contract, 0);
    });
  });
});
