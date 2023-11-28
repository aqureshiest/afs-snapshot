import { describe, it } from "node:test";
import assert from "node:assert";

import Manifest from "../manifest.js";
import Contract from "../contract.js";

describe("[d17af43a] OrContract", () => {
  it("[f084f02f] Returns the first non-falsy value", async () => {
    const input = {} as Input;
    const manifest: Manifest = new Manifest({
      "*": new Contract(
        "identity",
        JSON.stringify({
          coercion: "string",
          $OR: [0, null, false, true],
        }),
      ),
    });

    const { contract } = manifest.execute(input);
    assert.equal(contract, "true");
  });

  it("[24f6d787] Coerces to a number", async () => {
    const input = {} as Input;
    const manifest: Manifest = new Manifest({
      "*": new Contract(
        "identity",
        JSON.stringify({
          coercion: "number",
          $OR: [0, null, false, true],
        }),
      ),
    });

    const { contract } = manifest.execute(input);
    assert.equal(contract, 1);
  });

  it("[5046ad95] defaults to null when given an empty array", async () => {
    const input = {} as Input;
    const manifest = new Manifest({
      "*": new Contract(
        "identity",
        JSON.stringify({
          $OR: [],
        }),
      ),
    });

    const { contract } = manifest.execute(input);
    assert.equal(contract, null);
  });

  it("[5046ad95] coerces empty arrays", async () => {
    const input = {} as Input;
    const manifest = new Manifest({
      "*": new Contract(
        "identity",
        JSON.stringify({
          coercion: "number",
          $OR: [],
        }),
      ),
    });

    const { contract } = manifest.execute(input);
    assert.equal(contract, 0);
  });

  it("[3748bb65] is able to handle coercing numbers to numbers", async () => {
    const input = {} as Input;
    const manifest = new Manifest({
      "*": new Contract(
        "identity",
        JSON.stringify({
          coercion: "number",
          $OR: 1,
        }),
      ),
    });

    const { contract } = manifest.execute(input);
    assert.equal(contract, 1);
  });

  it("[3748bb65] is able to handle coercing strings to strings", async () => {
    const input = {} as Input;
    const manifest = new Manifest({
      "*": new Contract(
        "identity",
        JSON.stringify({
          coercion: "string",
          $OR: "string",
        }),
      ),
    });

    const { contract } = manifest.execute(input);
    assert.equal(contract, "string");
  });
});
