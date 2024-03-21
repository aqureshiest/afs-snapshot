import { before, describe, it, mock } from "node:test";
import assert from "node:assert";

import createPluginContext from "@earnest-labs/microservice-chassis/createPluginContext.js";
import registerChassisPlugins from "@earnest-labs/microservice-chassis/registerChassisPlugins.js";
import readJsonFile from "@earnest-labs/microservice-chassis/readJsonFile.js";

import Contract from "./contract.js";
import Manifest from "./manifest.js";

describe("[462fd166] manifest.execute", () => {
  let context;
  let applicationServiceClient;
  // let analyticsServiceClient;
  before(async () => {
    const pkg = await readJsonFile("./package.json");
    pkg.logging = { level: "error" };
    context = await createPluginContext(pkg);
    await registerChassisPlugins(context);
    applicationServiceClient =
      context.loadedPlugins.applicationServiceClient.instance;
    // analyticsServiceClient =
    //   context.loadedPlugins.analyticsServiceClient.instance;
  });

  it("[be92134e] runs without error", async () => {
    const input = {} as Input;
    const manifest = new Manifest(context, "manifestTest", {
      "*": new Contract({ raw: JSON.stringify({}) }),
    });

    const { contract } = await manifest.execute(input, { context, ...input });
    assert(contract);
  });

  it("[ef16134b] contract references", async () => {
    const input = {} as Input;
    const manifest = new Manifest(context, "manifestTest", {
      "*": new Contract({
        raw: "{{{ json (contract 'reference')}}}",
      }),
      reference: new Contract({ key: "reference", raw: "42" }),
    });

    const { contract } = await manifest.execute(input, { context, ...input });

    const parsed = JSON.parse(JSON.stringify(contract));

    assert.strictEqual(parsed, 42);
  });

  it("[c98ac5ae] list helper", async () => {
    const input = {} as Input;
    const manifest = new Manifest(context, "manifestTest", {
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

    const { contract } = await manifest.execute(input, { context, ...input });

    const parsed = JSON.parse(JSON.stringify(contract));

    assert.deepEqual(parsed, [42, 404, 9001]);
  });

  it("[6b6d7ced] list helper (merged)", async () => {
    const input = {} as Input;
    const manifest = new Manifest(context, "manifestTest", {
      "*": new Contract({
        raw: `
      {{#list merge=true}}
        42
        {{{ json (contract 'numbers' )}}}
      {{/list}}
      `,
      }),
      numbers: [
        new Contract({ key: "testContract2", raw: "404" }),
        new Contract({ key: "testContract3", raw: "9001" }),
      ],
    });

    const { contract } = await manifest.execute(input, { context, ...input });

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
        raw: `{{{ajv 'validate' 'nameSchema' (json (contract 'name')) }}}`,
      }),
      name: new Contract({ key: "name", raw: JSON.stringify(name) }),
    });
    const ajv = context.loadedPlugins.schema.instance;
    ajv.compile(schema);
    const { contract } = await manifest.execute(input, { context, ...input });

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
        raw: `"{{{ajv 'errors' 'nameSchema' (json (contract 'name')) }}}"`,
      }),
      name: new Contract({ key: "name", raw: JSON.stringify(name) }),
    });

    const { contract } = await manifest.execute(input, { context, ...input });
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

    const { contract } = await manifest.execute(input, { context, ...input });
    const parsed = JSON.parse(JSON.stringify(contract));

    assert.deepEqual(parsed, schema);
  });

  it("[2eeb43a0] it should throw when executing an ApplicationEvent contract-type if a request to getEventInputTypes fails", async () => {
    const input = {} as Input;

    mock.method(applicationServiceClient, "getEventInputTypes", () => {
      throw new Error("failed to get event inputs");
    });

    const manifest = new Manifest(context, "manifestApplicationEvent", {
      key: "testContract",
      "*": new Contract({
        key: "testContract",
        raw: `{
          "event": "createApplication",
          "payload": {
            "relationships": []
          },
          "fields": "application { id }"
        }`,
        type: "applicationEvent",
      }),
    });

    try {
      await manifest.execute(input, { context, ...input });
    } catch (error) {
      assert(error);
    }
  });

  it("[5995320f] it should throw when executing an ApplicationEvent contract-type if an event doesn't exist on eventInputTypes", async () => {
    const input = {} as Input;

    mock.method(applicationServiceClient, "getEventInputTypes", () => {
      applicationServiceClient.eventInputTypes = {
        eventDoesNotExist: {
          args: "String!",
        },
      };
    });

    const manifest = new Manifest(context, "manifestApplicationEvent", {
      key: "testContract",
      "*": new Contract({
        key: "testContract",
        raw: `{
          "event": "createApplication",
          "payload": {
            "relationships": []
          },
          "fields": "application { id }"
        }`,
        type: "applicationEvent",
      }),
    });

    try {
      await manifest.execute(input, { context, ...input });
    } catch (error) {
      assert.equal(
        error.message,
        "[694d632f] Event is not defined on event types"
      );
    }

    mock.reset();
  });

  it("[1b2bbdaa] it should execute an ApplicationEvent contract-type", async () => {
    const input = {} as Input;

    applicationServiceClient.eventInputTypes = {
      createApplication: {
        meta: "EventMeta",
        relationships: "[RelationshipInput]",
      },
    };

    mock.method(applicationServiceClient, "sendRequest", () => {
      return {
        createApplication: {
          id: 1,
          error: null,
          application: {
            id: 2,
          },
        },
      };
    });

    const manifest = new Manifest(context, "manifestApplicationEvent", {
      key: "testContract",
      "*": new Contract({
        key: "testContract",
        raw: `{
          "event": "createApplication",
          "payload": {
            "relationships": []
          },
          "fields": "application { id }"
        }`,
        type: "applicationEvent",
      }),
    });

    const { contract } = await manifest.execute(input, { context, ...input });

    assert(contract);
  });

  it("[9edd8cee] it should execute an ApplicationData contract-type when an id exists in the definition", async () => {
    const input = {} as Input;

    mock.method(applicationServiceClient, "sendRequest", () => {
      return {
        application: {
          id: 1,
        },
      };
    });

    const manifest = new Manifest(context, "manifestApplicationData", {
      key: "testContract",
      "*": new Contract({
        key: "testContract",
        raw: `{
          "id": 1
        }`,
        type: "applicationData",
      }),
    });

    const { contract } = await manifest.execute(input, { context, ...input });

    assert(contract);
  });

  it("[411017c5] it should execute an ApplicationData contract-type when criteria exists in the definition", async () => {
    const input = {} as Input;

    mock.method(applicationServiceClient, "sendRequest", () => {
      return {
        applications: [{ id: 1 }, { id: 2 }],
      };
    });

    const manifest = new Manifest(context, "manifestApplicationData", {
      key: "testContract",
      "*": new Contract({
        key: "testContract",
        raw: `{
          "criteria": [{ "search": "test@earnest.com" }]
        }`,
        type: "applicationData",
      }),
    });

    const { contract } = await manifest.execute(input, { context, ...input });

    assert(contract);
  });

  // it("[1b2bbdaa] it should execute an Analytics contract-type", async () => {
  //   const input = {} as Input;

  //   applicationServiceClient.eventInputTypes = {
  //     createApplication: {
  //       meta: "EventMeta",
  //       relationships: "[RelationshipInput]",
  //     },
  //   };

  //   mock.method(analyticsServiceClient, "track", () => {
  //     return true;
  //   });

  //   const manifest = new Manifest(context, "analytics", {
  //     key: "testContract",
  //     "*": new Contract({
  //       key: "testContract",
  //       raw: `{
  //         "event": "createApplication",
  //         "payload": {
  //           "relationships": []
  //         },
  //         "fields": "application { id }"
  //       }`,
  //       type: "applicationEvent",
  //     }),
  //   });

  //   const { contract } = await manifest.execute(input, { context, ...input });

  //   assert(contract);
  // });
});
