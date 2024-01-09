import { before, describe, it } from "node:test";
import assert from "node:assert";

import createPluginContext from "@earnest-labs/microservice-chassis/createPluginContext.js";
import readJsonFile from "@earnest-labs/microservice-chassis/readJsonFile.js";

import Contract from "./contract.js";
import Manifest from "./manifest.js";

describe("[462fd166] manifest.execute", () => {
  let context;
  before(async () => {
    const pkg = await readJsonFile("./package.json");
    pkg.logging = { level: "error" };
    context = await createPluginContext(pkg);
  });

  it("[be92134e] runs without error", async () => {
    const input = {} as Input;
    const manifest = new Manifest(context, 'manifestTest', {
      "*": new Contract({ raw: JSON.stringify({}) }),
    });

    const { contract } = manifest.execute(context, input);
    assert(contract);
  });

  it("[ef16134b] contract references", async () => {
    const input = {} as Input;
    const manifest = new Manifest(context, 'manifestTest', {
      "*": new Contract({ raw: "{{{ contract 'reference'}}}" }),
      reference: new Contract({ raw: "42" }),
    });

    const { contract } = manifest.execute(context, input);

    const parsed = JSON.parse(JSON.stringify(contract));

    assert.strictEqual(parsed, 42);
  });

  it("[ef16134b] embedded contracts", async () => {
    const input = {} as Input;
    const manifest = new Manifest(context, 'manifestTest',{
      "*": new Contract({
        raw: "{{#contract type='identity' key='embedded'}}42{{/contract}}",
      }),
    });

    const { contract } = manifest.execute(context, input);

    const parsed = JSON.parse(JSON.stringify(contract));

    assert.strictEqual(parsed, 42);
  });

  it("[c98ac5ae] list helper", async () => {
    const input = {} as Input;
    const manifest = new Manifest(context, 'manifestTest',{
      "*": new Contract({
        raw: `
      {{#list}}
        42
        404
        9001
      {{/list}}
      `,
      }),
    });

    const { contract } = manifest.execute(context, input);

    const parsed = JSON.parse(JSON.stringify(contract));

    assert.deepEqual(parsed, [42, 404, 9001]);
  });

  it("[6b6d7ced] list helper (merged)", async () => {
    const input = {} as Input;
    const manifest = new Manifest(context, 'manifestTest',{
      "*": new Contract({
        raw: `
      {{#list merge=true}}
        42
        {{{ contract 'numbers' }}}
      {{/list}}
      `,
      }),
      numbers: [new Contract({ raw: "404" }), new Contract({ raw: "9001" })],
    });

    const { contract } = manifest.execute(context, input);

    const parsed = JSON.parse(JSON.stringify(contract));

    assert.deepEqual(parsed, [42, 404, 9001]);
  });
});
