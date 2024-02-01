import { before, describe, it } from "node:test";
import assert from "node:assert";

import createPluginContext from "@earnest-labs/microservice-chassis/createPluginContext.js";
import registerChassisPlugins from "@earnest-labs/microservice-chassis/registerChassisPlugins.js";
import readJsonFile from "@earnest-labs/microservice-chassis/readJsonFile.js";

import Contract from "./contract.js";
import Manifest from "./manifest.js";

describe("[462fd166] manifest.execute", () => {
  let context;
  before(async () => {
    const pkg = await readJsonFile("./package.json");
    pkg.logging = { level: "error" };
    context = await createPluginContext(pkg);
    await registerChassisPlugins(context);
  });

  it("[be92134e] runs without error", async () => {
    const input = {} as Input;
    const manifest = new Manifest(context, "manifestTest", {
      "*": new Contract({ key: "testContract", raw: JSON.stringify({}) }),
    });

    const { contract } = await manifest.execute({ context, ...input });
    assert(contract);
  });

  it("[ef16134b] contract references", async () => {
    const input = {} as Input;
    const manifest = new Manifest(context, "manifestTest", {
      "*": new Contract({
        key: "testContract",
        raw: "{{{ contract 'reference'}}}",
      }),
      reference: new Contract({ key: "reference", raw: "42" }),
    });

    const { contract } = await manifest.execute({ context, ...input });

    const parsed = JSON.parse(JSON.stringify(contract));

    assert.strictEqual(parsed, 42);
  });

  it("[26d20207] embedded contracts", async () => {
    const input = {} as Input;
    const manifest = new Manifest(context, "manifestTest", {
      "*": new Contract({
        key: "testContract",
        raw: "{{#contract type='identity' key='embedded'}}42{{/contract}}",
      }),
    });

    const { contract } = await manifest.execute({ context, ...input });

    const parsed = JSON.parse(JSON.stringify(contract));

    assert.strictEqual(parsed, 42);
  });

  it("[c98ac5ae] list helper", async () => {
    const input = {} as Input;
    const manifest = new Manifest(context, "manifestTest", {
      "*": new Contract({
        key: "testContract",
        raw: `
      {{#list}}
        42
        404
        9001
      {{/list}}
      `,
      }),
    });

    const { contract } = await manifest.execute({ context, ...input });

    const parsed = JSON.parse(JSON.stringify(contract));

    assert.deepEqual(parsed, [42, 404, 9001]);
  });

  it("[6b6d7ced] list helper (merged)", async () => {
    const input = {} as Input;
    const manifest = new Manifest(context, "manifestTest", {
      "*": new Contract({
        key: "testContract",
        raw: `
      {{#list merge=true}}
        42
        {{{ contract 'numbers' }}}
      {{/list}}
      `,
      }),
      numbers: [
        new Contract({ key: "testContract2", raw: "404" }),
        new Contract({ key: "testContract3", raw: "9001" }),
      ],
    });

    const { contract } = await manifest.execute({ context, ...input });

    const parsed = JSON.parse(JSON.stringify(contract));

    assert.deepEqual(parsed, [42, 404, 9001]);
  });
  const schema = {
    type: "object",
    $id: "nameSchema",
    properties: {
      first: {
        type: "string",
        pattern: "^[^@!¡¿?#$%^&*()_+]+$",
        errorMessage: "First name is required.",
      },
      last: {
        type: "string",
        pattern: "^[^@!¡¿?#$%^&*()_+]+$",
      },
      middle: {
        type: "string",
        pattern: "^[^@!¡¿?#$%^&*()_+]+$",
      },
      title: {
        type: "string",
        pattern: "^[^@!¡¿?#$%^&*()_+]+$",
      },
    },
    required: ["first", "last"],
  };
  it("[670555db] ajv helper validate", async () => {
    const input = {} as Input;
    const name = {
      first: "test",
    };
    const manifest = new Manifest(context, "manifestAJV", {
      "*": new Contract({
        key: "testContract",
        raw: `{{{ajv 'validate' 'nameSchema' (contract 'name') }}}`,
      }),
      name: new Contract({ key: "name", raw: JSON.stringify(name) }),
    });
    const ajv = context.loadedPlugins.schema.instance;
    ajv.compile(schema);
    const { contract } = await manifest.execute({ context, ...input });

    const parsed = JSON.parse(JSON.stringify(contract));

    assert.deepEqual(parsed, false);
  });

  it("[5eb35b03] ajv helper errors", async () => {
    const input = {} as Input;

    const name = {
      first: "test",
    };
    const manifest = new Manifest(context, "manifestAJV", {
      key: "testContract",
      "*": new Contract({
        key: "testContract",
        raw: `"{{{ajv 'errors' 'nameSchema' (contract 'name') }}}"`,
      }),
      name: new Contract({ key: "name", raw: JSON.stringify(name) }),
    });

    const { contract } = await manifest.execute({ context, ...input });
    const parsed = JSON.parse(JSON.stringify(contract));

    assert.deepEqual(parsed, "data must be object");
  });
  it("[05166b70] schema helper", async () => {
    const input = {} as Input;

    const manifest = new Manifest(context, "manifestAJV", {
      key: "testContract",
      "*": new Contract({
        key: "testContract",
        raw: `{{{json (schema 'nameSchema')}}}`,
      }),
    });

    const { contract } = await manifest.execute({ context, ...input });
    const parsed = JSON.parse(JSON.stringify(contract));

    assert.deepEqual(parsed, schema);
  });
});
