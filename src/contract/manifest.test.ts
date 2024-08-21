import { before, describe, it, mock } from "node:test";
import assert from "node:assert";
import { Response } from "express";

import createPluginContext from "@earnest-labs/microservice-chassis/createPluginContext.js";
import registerChassisPlugins from "@earnest-labs/microservice-chassis/registerChassisPlugins.js";
import readJsonFile from "@earnest-labs/microservice-chassis/readJsonFile.js";

import Contract from "./contract.js";
import Manifest from "./manifest.js";
import RedisClient from "../clients/redis/index.js";

describe("[462fd166] manifest.execute", () => {
  let context;
  let applicationServiceClient;
  let analyticsServiceClient;
  let neasServiceClient;
  let res;
  before(async () => {
    const pkg = await readJsonFile("./package.json");
    pkg.logging = { level: "error" };
    context = await createPluginContext(pkg);
    await registerChassisPlugins(context);
    applicationServiceClient =
      context.loadedPlugins.applicationServiceClient.instance;
    analyticsServiceClient =
      context.loadedPlugins.analyticsServiceClient.instance;
    neasServiceClient = context.loadedPlugins.NeasClient.instance;
    res = {} as Response;
  });

  describe("[34e19187] embedded", () => {
    it("[775702ec] executes an embedded contract", async () => {
      const input = {} as Input<unknown>;
      const manifest = new Manifest(
        "manifestTest",
        {
          "*": "raw",
        },
        {
          raw: {
            default: new Contract({
              raw: `{{#contract type='identity' key='embedded'}}42{{/contract}}`,
            }),
          },
        },
      );

      const result = (await manifest.execute(context, {}, input)).toJSON();

      assert.equal(result, 42);

      assert(result);
    });
  });

  it("[be92134e] runs without error", async () => {
    const input = {} as Input<unknown>;
    const manifest = new Manifest(
      "manifestTest",
      {
        "*": "raw",
      },
      {
        raw: {
          default: new Contract({ raw: JSON.stringify({}) }),
        },
      },
    );

    const result = await manifest.execute(context, {}, input);
    assert(result);
  });

  it("[ef16134b] contract references", async () => {
    const input = {} as Input<unknown>;
    const manifest = new Manifest(
      "manifestTest",
      {
        "*": "raw",
        reference: "reference",
      },
      {
        raw: {
          default: new Contract({
            raw: "{{{ json (contract 'reference')}}}",
          }),
        },
        reference: {
          default: new Contract({ key: "reference", raw: "42" }),
        },
      },
    );

    const result = await manifest.execute(context, {}, input);

    const parsed = JSON.parse(JSON.stringify(result));

    assert.strictEqual(parsed, 42);
  });

  it("[c98ac5ae] list helper", async () => {
    const input = {} as Input<unknown>;
    const manifest = new Manifest(
      "manifestTest",
      {
        "*": "raw",
      },
      {
        raw: {
          default: new Contract({
            raw: `
        {{#list}}
          42
          404
          9001
        {{/list}}
        `,
          }),
        },
      },
    );

    const result = await manifest.execute(context, {}, input);

    const parsed = JSON.parse(JSON.stringify(result));

    assert.deepEqual(parsed, [42, 404, 9001]);
  });

  it("[6b6d7ced] list helper (merged)", async () => {
    const input = {} as Input<unknown>;
    const manifest = new Manifest(
      "manifestTest",
      {
        "*": "raw",
        numbers: ["numbers.a", "numbers.b"],
      },
      {
        raw: {
          default: new Contract({
            raw: `
        {{#list merge=true}}
          42
          {{{ json (contract 'numbers' )}}}
        {{/list}}
        `,
          }),
        },
        numbers: {
          a: new Contract({ key: "testContract2", raw: "404" }),
          b: new Contract({ key: "testContract3", raw: "9001" }),
        },
      },
    );

    const result = await manifest.execute(context, {}, input);

    const parsed = JSON.parse(JSON.stringify(result));

    assert.deepEqual(parsed, [42, 404, 9001]);
  });

  it("[4c881b62] list helper (unique)", async () => {
    const input = {} as Input<unknown>;
    const manifest = new Manifest(
      "manifestTest",
      {
        "*": "raw",
      },
      {
        raw: {
          default: new Contract({
            raw: `
        {{#list unique=true}}
          42
          42
        {{/list}}
        `,
          }),
        },
      },
    );

    const result = await manifest.execute(context, {}, input);

    const parsed = JSON.parse(JSON.stringify(result));

    assert.deepEqual(parsed, [42]);
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
    const input = {} as Input<unknown>;
    const name = {
      first: "test",
    };
    const manifest = new Manifest(
      "manifestAJV",
      {
        "*": "raw",
        name: "name",
      },
      {
        raw: {
          default: new Contract({
            key: "testContract",
            raw: `{{{ajv 'validate' 'nameSchema' (json (contract 'name')) }}}`,
          }),
        },
        name: {
          default: new Contract({ key: "name", raw: JSON.stringify(name) }),
        },
      },
    );
    const ajv = context.loadedPlugins.schema.instance;
    ajv.compile(schema);
    const result = await manifest.execute(context, {}, input);

    const parsed = JSON.parse(JSON.stringify(result));

    assert.deepEqual(parsed, false);
  });

  it("[5eb35b03] ajv helper errors", async () => {
    const input = {} as Input<unknown>;

    const name = {
      first: "test",
    };
    const manifest = new Manifest(
      "manifestAJV",
      {
        "*": "raw",
        name: "name",
      },
      {
        raw: {
          default: new Contract({
            key: "testContract",
            raw: `"{{{ajv 'errors' 'nameSchema' (json (contract 'name')) }}}"`,
          }),
        },
        name: {
          default: new Contract({ key: "name", raw: JSON.stringify(name) }),
        },
      },
    );

    const result = await manifest.execute(context, {}, input);
    const parsed = JSON.parse(JSON.stringify(result));

    assert.deepEqual(parsed, "data must be object");
  });

  it("[05166b70] schema helper", async () => {
    const input = {} as Input<unknown>;

    const manifest = new Manifest(
      "manifestAJV",
      {
        "*": "raw",
      },
      {
        raw: {
          default: new Contract({
            key: "testContract",
            raw: `{{{json (schema 'nameSchema')}}}`,
          }),
        },
      },
    );

    const result = await manifest.execute(context, {}, input);
    const parsed = JSON.parse(JSON.stringify(result));

    assert.deepEqual(parsed, schema);
  });

  it("[2eeb43a0] it should throw when executing an ApplicationEvent contract-type if a request to getEventInputTypes fails", async () => {
    const input = {} as Input<unknown>;

    mock.method(applicationServiceClient, "getEventInputTypes", () => {
      throw new Error("failed to get event inputs");
    });

    const manifest = new Manifest(
      "manifestApplicationEvent",
      {
        "*": "raw",
      },
      {
        raw: {
          default: new Contract({
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
        },
      },
    );

    await assert.rejects(manifest.execute(context, {}, input));
  });

  it("[5995320f] it should throw when executing an ApplicationEvent contract-type if an event doesn't exist on eventInputTypes", async () => {
    const input = {} as Input<unknown>;

    mock.method(applicationServiceClient, "getEventInputTypes", () => {
      applicationServiceClient.eventInputTypes = {
        eventDoesNotExist: {
          args: "String!",
        },
      };
    });

    const manifest = new Manifest(
      "manifestApplicationEvent",
      {
        "*": "raw",
      },
      {
        raw: {
          default: new Contract({
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
        },
      },
    );

    await assert.rejects(manifest.execute(context, {}, input));
    mock.reset();
  });

  it("[1b2bbdaa] it should execute an ApplicationEvent contract-type", async () => {
    const input = {} as Input<unknown>;

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

    const manifest = new Manifest(
      "manifestApplicationEvent",
      {
        "*": "raw",
      },
      {
        raw: {
          default: new Contract({
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
        },
      },
    );

    const result = await manifest.execute(context, {}, input);

    assert(result);
  });

  /*
  it("[d177ce53] it should execute an Error contract-type", async () => {
    const input = {} as Input<unknown>;

    const manifest = new Manifest("manifestError", {
      key: "errorTestContract",
      "*": new Contract({
        key: "errorTestContract",
        raw: `{
          "error": "no-income-error"
        }`,
        type: "error",
      }),
    });

    const { contract } = await manifest.execute(input, {
      context,
      response: res,
      ...input,
    });

    assert(contract);
  });

  it("[d177ce53] it should execute an Error contract-type", async () => {
    const input = {} as Input<unknown>;

    const manifest = new Manifest(context, "manifestError", {
      key: "errorTestContract",
      "*": new Contract({
        key: "errorTestContract",
        raw: `{
          "error": "no-income-error"
        }`,
        type: "error",
      }),
    });

    const { contract } = await manifest.execute(input, {
      context,
      response: res,
      ...input,
    });

    assert(contract);
  });
  */

  it("[9edd8cee] it should execute an ApplicationData contract-type when an id exists in the definition", async () => {
    const input = {} as Input<unknown>;

    mock.method(applicationServiceClient, "sendRequest", () => {
      return {
        application: {
          id: 1,
        },
      };
    });

    const manifest = new Manifest(
      "manifestApplicationData",
      {
        "*": "raw",
      },
      {
        raw: {
          default: new Contract({
            key: "testContract",
            raw: `{
            "id": 1
          }`,
            type: "applicationData",
          }),
        },
      },
    );

    const result = await manifest.execute(context, {}, input);

    assert(result);
  });

  it("[5d6c5ca8] it should execute an plaidMethod contract-type when an id and a method keys exists in the definition", async () => {
    const input = {} as Input<unknown>;
    const manifest = new Manifest(
      "manifestPlaidMethod",
      {
        "*": "raw",
      },
      {
        raw: {
          default: new Contract({
            key: "testContract",
            raw: `{
            "method": "getLinkToken",
            "id": "asdasd",
            "payload": {}
          }`,
            type: "plaidMethod",
          }),
        },
      },
    );

    const result = await manifest.execute(context, {}, input);

    assert(result);
  });

  it("[813a2d8a] it should execute an redisMethod contract-type when an id and a method keys exists in the definition", async () => {
    const input = {} as Input<unknown>;
    const redisClient = new RedisClient(context);
    redisClient.client = {
      get: async function () {},
    };
    // redisClient.connect(context)
    const state = {
      manifest: "test",
      step: "test",
    };

    mock.method(redisClient.client, "get", async () => {
      return JSON.stringify(state);
    });

    const manifest = new Manifest(
      "manifestRedisMethod",
      {
        "*": "raw",
      },
      {
        raw: {
          default: new Contract({
            key: "testContract",
            raw: `{
            "redisMethod": "getApplicationState",
            "key": "asdasd",
            "value": {}
          }`,
            type: "redisMethod",
          }),
        },
      },
    );

    const result = await manifest.execute(
      {
        ...context,
        loadedPlugins: {
          ...context.loadedPlugins,
          redis: {
            instance: redisClient,
          },
        },
      },
      {},
      { response: res, ...input },
    );

    assert(result);
  });

  it("[5d6c5ca8] it should execute an Syllabus contract-type when an id and a method keys exists in the definition", async () => {
    const input = {} as Input<unknown>;
    const manifest = new Manifest(
      "manifestSyllabus",
      {
        "*": "raw",
      },
      {
        raw: {
          default: new Contract({
            key: "testContract",
            raw: `{
            "status": "completed",
            "statuses": ["completed", "completed", "completed"],
            "mode": "stats",
            "progress": {
              "totalQuestions": 3,
              "completedQuestions":0
            },
            "id": "asdasdasd"
          }`,
            type: "section",
          }),
        },
      },
    );

    const result = await manifest.execute(context, {}, input);

    assert(result);
  });

  it("[df40cd1a] it should execute an Syllabus contract-type when an id and a method keys exists in the definition", async () => {
    const input = {} as Input<unknown>;
    const manifest = new Manifest(
      "manifestSyllabus",
      {
        "*": "raw",
      },
      {
        raw: {
          default: new Contract({
            key: "testContract",
            raw: `{
            "status": "completed",
            "statuses": ["completed", "completed", "completed"],
            "mode": "section",
            "progress": {
              "totalQuestions": 3,
              "completedQuestions":0
            },
            "id": "asdasdasd"
          }`,
            type: "section",
          }),
        },
      },
    );

    const result = await manifest.execute(context, {}, input);

    assert(result);
  });

  it("[411017c5] it should execute an ApplicationData contract-type when criteria exists in the definition", async () => {
    const input = {} as Input<unknown>;

    mock.method(applicationServiceClient, "sendRequest", () => {
      return {
        applications: [{ id: 1 }, { id: 2 }],
      };
    });

    const manifest = new Manifest(
      "manifestApplicationData",
      {
        "*": "raw",
      },
      {
        raw: {
          default: new Contract({
            key: "testContract",
            raw: `{
            "criteria": [{ "search": "test@earnest.com" }]
          }`,
            type: "applicationData",
          }),
        },
      },
    );

    const result = await manifest.execute(context, {}, input);

    assert(result);
  });

  /*
  it("[1b2bbdaa] it should execute an Analytics contract-type income-verification-method plaid", async () => {
    const input = {
      request: {
        method: "POST",
      },
      auth: {
        session: {
          userId: "1234",
          exp: 0,
          isValid: true,
        },
      },
      applicationState: null,
      application: {
        id: 1,
        primary: {
          id: 2,
          details: {
            financialAccounts: [
              {
                plaidAccessToken: "1234",
              },
            ],
          },
        },
      },
    } as unknown as Input<unknown>;

    mock.method(analyticsServiceClient, "track", () => {
      return true;
    });

    const manifest = new Manifest(context, "analytics", {
      key: "analytics",
      "*": new Contract({
        key: "analytics",
        raw: `{
          "event": "Viewed rate test",
          "type": "track",
          "payload":{
            "id":"9999",
            "fields": ["income_verification_method"]
          }
        }`,
        type: "analytics",
      }),
    });

    const { contract } = await manifest.execute(input, {
      context,
      response: res,
      ...input,
    });
    assert(contract);
  });


  it("[186c9bd5] it should execute an Analytics contract-type income-verification-method manual", async () => {
    const input = {
      request: {
        method: "POST",
      },
      auth: {
        session: {
          userId: "1234",
          exp: 0,
          isValid: true,
        },
      },
      applicationState: null,
      application: {
        id: 1,
        primary: {
          id: 2,
          details: {
            financialAccounts: [
              {
                plaidAccessToken: null,
              },
            ],
          },
        },
      },
    } as Input<unknown>;

    mock.method(analyticsServiceClient, "track", () => {
      return true;
    });

    const manifest = new Manifest(context, "analytics", {
      key: "analytics",
      "*": new Contract({
        key: "analytics",
        raw: `{
          "event": "Viewed rate test",
          "type": "track",
          "payload":{
            "id":"9999",
            "fields": ["income_verification_method"]
          }
        }`,
        type: "analytics",
      }),
    });

    const { contract } = await manifest.execute(input, {
      context,
      res,
      ...input,
    });
    assert(contract);
  });
  */

  it("[73147945] it should execute an Analytics contract-type", async () => {
    const input = {
      request: {
        method: "POST",
      },
    } as Input<unknown>;

    mock.method(analyticsServiceClient, "track", () => {
      return true;
    });

    const manifest = new Manifest(
      "analytics",
      {
        "*": "raw",
      },
      {
        raw: {
          default: new Contract({
            key: "analytics",
            raw: `{
            "event": "Viewed rate test",
            "type": "track",
            "payload":{
              "id":"9999"
            }
          }`,
            type: "analytics",
          }),
        },
      },
    );

    const result = await manifest.execute(context, {}, input);

    assert(result);
  });

  /*
  it("[5c3f53ea] it should execute an Analytics contract-type", async () => {
    const input = {
      request: {
        method: "POST",
      },
    } as Input<unknown>;

    mock.method(analyticsServiceClient, "track", () => {
      return true;
    });

    const manifest = new Manifest("analytics", {}, {
      key: "analytics",
      "*": new Contract({
        key: "analytics",
        raw: `{
          "event": "Viewed rate test",
          "type": "identify",
          "payload":{
            "id":"9999"
          }
        }`,
        type: "analytics",
      }),
    });

    const { contract } = await manifest.execute(input, {
      context,
      res,
      ...input,
    });

    assert(contract);
  });
  */

  it("[4r3ggwqq] it should execute an Cookie contract-type", async () => {
    const input = {} as Input<unknown>;

    const manifest = new Manifest(
      "manifestCookie",
      {
        "*": "raw",
      },
      {
        raw: {
          default: new Contract({
            key: "testContract",
            raw: `{
              "name": "test",
              "value": "test",
              "options": {}
          }`,
            type: "cookie",
          }),
        },
      },
    );

    const result = await manifest.execute(context, {}, input);
    assert(result);
  });

  it("[2y2ffwcp] it should execute an Neas-Request contract-type", async () => {
    const input = {} as Input<unknown>;

    mock.method(neasServiceClient, "createAccountlessSession", () => {
      return "";
    });

    const manifest = new Manifest(
      "manifestNeasRequest",
      {
        "*": "raw",
      },
      {
        raw: {
          default: new Contract({
            key: "testContract",
            raw: `{
              "neasMethod": "createAccountlessSession"
          }`,
            type: "neasRequest",
          }),
        },
      },
    );

    const result = await manifest.execute(context, {}, input);
    assert(result);
  });

  it("[ae226507] obj helper", async () => {
    const input = {} as Input<unknown>;
    const manifest = new Manifest(
      "manifestTest",
      {
        "*": "raw",
      },
      {
        raw: {
          default: new Contract({
            raw: `
        {{#obj}}
          {"testkey1": "testvalue1"}
          {"testkeyArray": ["testvalue2"]}
          {"testkeyArray": ["testvalue3"]}
          {"testkeyArray": "testvalue3-2"}
          {"testkeyArray2": ["testvalue4"]}
        {{/obj}}
        `,
          }),
        },
      },
    );

    const result = await manifest.execute(context, {}, input);

    const parsed = JSON.parse(JSON.stringify(result));

    assert.deepEqual(parsed, {
      testkey1: "testvalue1",
      testkeyArray: ["testvalue2", "testvalue3", "testvalue3-2"],
      testkeyArray2: ["testvalue4"],
    });
  });

  it("[ba9215d8] spread helper", async () => {
    const input = {} as Input<unknown>;
    const manifest = new Manifest(
      "manifestTest",
      {
        "*": "raw",
      },
      {
        raw: {
          default: new Contract({
            raw: `
        {
          "testkey1": "testvalue1"
          {{#spread}}
            {"testkey2": "testvalue2", "testkey3": "testvalue3"}
          {{/spread}}
        }
        `,
          }),
        },
      },
    );

    const result = await manifest.execute(context, {}, input);

    const parsed = JSON.parse(JSON.stringify(result));

    assert.deepEqual(parsed, {
      testkey1: "testvalue1",
      testkey2: "testvalue2",
      testkey3: "testvalue3",
    });
  });

  it("[15d54c05] spread helper - empty definition", async () => {
    const input = {} as Input<unknown>;
    const manifest = new Manifest(
      "manifestTest",
      {
        "*": "raw",
      },
      {
        raw: {
          default: new Contract({
            raw: `
        {
          "testkey1": "testvalue1"
          {{#spread}}
            null
          {{/spread}}
        }
        `,
          }),
        },
      },
    );

    const result = await manifest.execute(context, {}, input);

    const parsed = JSON.parse(JSON.stringify(result));

    assert.deepEqual(parsed, {
      testkey1: "testvalue1",
    });
  });

  it("[0cc7ae75] simple template helpers", async () => {
    const input = {
      request: {
        body: {
          values: {
            numbers: [1, 2],
            date: "2013-09-01T07:00:00.000Z",
            dateOfBirth: {
              month: "12",
              day: "20",
              year: "1950",
            },
            location: [
              {
                street1: "545 N 34TH ST",
                street2: null,
                city: "PADUCAH",
                state: "CA",
                zip: "42001",
                citizenship: "citizen",
                type: "primary",
              },
              {
                street1: "789 6th Avenue",
                street2: null,
                city: "San Francisco",
                state: "CA",
                zip: "94118",
                citizenship: null,
                type: "previous",
              },
            ],
            EmployedIncomes: [
              {
                employer: "BigCompany",
                type: "employment",
              },
            ],
            tags: ["RC_Primary_Decline"],
          },
        },
      },
    } as unknown as Input<unknown>;
    const manifest = new Manifest(
      "manifestTest",
      {
        "*": "raw",
      },
      {
        raw: {
          default: new Contract({
            raw: `
            {
              {{#noop}} {"nothing": "this should not show} {{/noop}}
              "equals": {{{eq "true" "true"}}},
              "ne": {{{ne "true" "true"}}},
              "lt": {{{lt 1 2}}},
              "gt": {{{gt 1 2}}},
              "lte": {{{lte 1 2}}},
              "gte": {{{gte 1 2}}},
              "not": {{{not true}}},
              "notNull": {{{notNull null}}},
              "includes": {{{includes request.body.values.numbers 1}}},
              "and": {{{and true true}}},
              "or": {{{or true false}}},
              "boolean": {{{boolean true}}},
              "number": {{{number "12345"}}},
              "mathAdd": {{{mathAdd 1 2}}},
              "toUpper": "{{{toUpper 'test'}}}",
              "toNeutralize": "{{{toNeutralize 'self_employed'}}}",
              "toNeutralizeAndUpper": "{{{toNeutralizeAndUpper 'self_employed'}}}",
              "employedStatus": "{{{mapEmploymentStatusType 'self_employed'}}}",
              "unspecifiedStatus": "{{{mapEmploymentStatusType 'unemployed'}}}",
              "month": "{{{month '1988-10-14'}}}",
              "day": "{{{day '1988-10-14'}}}",
              "year": "{{{year '1988-10-14'}}}",
              "formatPhoneNumber": "{{{formatPhoneNumber '5555555555'}}}",
              "dateOfBirth": "{{{dateObjToString request.body.values.dateOfBirth}}}",
              "formatToUSCurrency": "{{{formatToUSCurrency 1000000}}}",
              "formatDollarsToCents": "{{{formatDollarsToCents '$12,3456.89'}}}",
              "stateMinLoan": {{{json (stateMinLoan request.body.values.location)}}},
              "hasValues": {{{hasValues request.body.values.dateOfBirth}}},
              "reachedTimeout": {{{reachedTimeout request.body.values.date 60000}}},
              "employed": "{{{mapIncomeTypeToEmplStatus request.body.values.EmployedIncomes}}}",
              "searchDeniedArtifactTags": {{{searchDeniedArtifactTags request.body.values.tags}}}
            }
        `,
          }),
        },
      },
    );

    const result = await manifest.execute(context, {}, input);

    const parsed = JSON.parse(JSON.stringify(result));

    assert.deepEqual(parsed, {
      equals: true,
      ne: false,
      lt: true,
      gt: false,
      lte: true,
      gte: false,
      not: false,
      notNull: false,
      includes: true,
      and: true,
      or: true,
      boolean: true,
      number: 12345,
      mathAdd: 3,
      toUpper: "Test",
      toNeutralize: "self employed",
      toNeutralizeAndUpper: "Self employed",
      employedStatus: "employment",
      unspecifiedStatus: "unspecified",
      month: "10",
      day: "14",
      year: "1988",
      formatPhoneNumber: "555-555-5555",
      dateOfBirth: "1950-12-20",
      formatToUSCurrency: "$10,000.00",
      formatDollarsToCents: "12345689",
      stateMinLoan: 1000000,
      hasValues: true,
      reachedTimeout: true,
      employed: "employed",
      searchDeniedArtifactTags: true,
    });
  });

  it("[93dc0646] test mapRatePayments", async () => {
    const input = {
      request: {
        body: {
          values: [
            {
              rate: 532,
              rateType: "fixed",
              term: 60,
              minPaymentAmountInCents: 114566,
            },
            {
              rate: 631,
              rateType: "variable",
              term: 60,
              minPaymentAmountInCents: 117424,
            },
          ],
        },
      },
    } as unknown as Input<unknown>;
    const manifest = new Manifest(
      "manifestTest",
      {
        "*": "raw",
      },
      {
        raw: {
          default: new Contract({
            raw: `
            {
              "mapRatePayments": {{{json (mapRatePayments request.body.values)}}}
            }
        `,
          }),
        },
      },
    );

    const result = await manifest.execute(context, {}, input);

    const parsed = JSON.parse(JSON.stringify(result));

    assert.deepEqual(parsed, {
      mapRatePayments: {
        fixedData: [["5 year", "5.32%", "$1,145.66"]],
        variableData: [["5 year", "6.31%", "$1,174.24"]],
      },
    });
  });

  /*
  it("[1bb916db] sumIncomeAmountRange and totalSum template helper", async () => {
    const input = {
      request: {
        body: {
          values: {
            incomes: [
              {
                employer: "BigCompany",
                type: "employment",
                amount: 1000000,
              },
              {
                type: "child_support_or_alimony",
                amount: 1000000,
              },
              {
                type: "social_security_or_pension",
                amount: 1000000,
              },
            ],
            asset: [
              {
                type: "claimed_total_assets",
                amount: 5500000,
              },
            ],
          },
        },
      },
    } as unknown as Input;
    const manifest = new Manifest(context, "manifestTest", {
      "*": new Contract({
        raw: `
          {
            "sumRange": {{{sumIncomeAmountRange request.body.values.incomes 'amount' 0 2}}},
            "totalSum": {{{totalSum request.body.values.asset.[0].amount (sumIncomeAmountRange request.body.values.incomes 'amount' 0 2)}}}
          }
      `,
      }),
    });

    const { contract } = await manifest.execute(input, {
      context,
      res,
      ...input,
    });

    const parsed = JSON.parse(JSON.stringify(contract));

    assert.deepEqual(parsed, {
      sumRange: 3000000,
      totalSum: 8500000,
    });
  });
  */

  /*
  it("[dead6a9a] findInArray helper", async () => {
    const input = {
      request: {
        body: {
          values: {
            degrees: [
              {
                id: "high_school",
                value: "high_school",
                label: "High School Diploma",
              },
              {
                id: "incomplete_grads",
                value: "incomplete_grads",
                label: "Incomplete Bachelor's/Associate's",
              },
              { id: "associates", value: "associates", label: "Associate's" },
            ],
          },
        },
      },
    } as unknown as Input<unknown>;
    const manifest = new Manifest(context, "manifestTest", {
      "*": new Contract({
        raw: `
          {
            "findInArray": "{{{findInArray (json request.body.values.degrees) 'id' 'incomplete_grads' 'label'}}}"
          }
      `,
      }),
    });

    const { contract } = await manifest.execute(input, {
      context,
      res,
      ...input,
    });

    const parsed = JSON.parse(JSON.stringify(contract));

    assert.deepEqual(parsed, {
      findInArray: "Incomplete Bachelor's/Associate's",
    });
  });

  it("[4e3bcb19] someSelected and selectedAccounts financial account template helper", async () => {
    const input = {
      request: {
        body: {
          values: {
            financialAccounts: [
              {
                index: 0,
                name: "asdfk",
                type: "checking",
                selected: true,
                account_last4: "3456",
                institution_name: null,
                monolithFinancialAccountID: "2214213",
                balance: 1400000,
                plaidAccountID: null,
                plaidItemID: null,
                plaidAccessToken: null,
              },
              {
                index: 0,
                name: "dfldkfd",
                type: "checking",
                selected: false,
                account_last4: "6064",
                institution_name: null,
                monolithFinancialAccountID: "2214213",
                balance: 1000000,
                plaidAccountID: null,
                plaidItemID: null,
                plaidAccessToken: null,
              },
            ],
          },
        },
      },
    } as unknown as Input;
    const manifest = new Manifest(context, "manifestTest", {
      "*": new Contract({
        raw: `
          {
            "someSelected": {{{someSelected request.body.values.financialAccounts}}},
            "selectedAccounts": {{{json (selectedAccounts request.body.values.financialAccounts)}}}
          }
      `,
      }),
    });

    const { contract } = await manifest.execute(input, {
      context,
      res,
      ...input,
    });

    const parsed = JSON.parse(JSON.stringify(contract));

    assert.deepEqual(parsed, {
      someSelected: true,
      selectedAccounts: [
        {
          index: 0,
          name: "asdfk",
          type: "checking",
          selected: true,
          account_last4: "3456",
          institution_name: null,
          monolithFinancialAccountID: "2214213",
          balance: 1400000,
          plaidAccountID: null,
          plaidItemID: null,
          plaidAccessToken: null,
        },
      ],
    });
  });
  */
});
