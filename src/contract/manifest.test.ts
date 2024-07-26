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

  it("[be92134e] runs without error", async () => {
    const input = {} as Input;
    const manifest = new Manifest(context, "manifestTest", {
      "*": new Contract({ raw: JSON.stringify({}) }),
    });

    const { contract } = await manifest.execute(input, {
      context,
      res,
      ...input,
    });
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

    const { contract } = await manifest.execute(input, {
      context,
      res,
      ...input,
    });

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

    const { contract } = await manifest.execute(input, {
      context,
      res,
      ...input,
    });

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

    const { contract } = await manifest.execute(input, {
      context,
      res,
      ...input,
    });

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
    const { contract } = await manifest.execute(input, {
      context,
      res,
      ...input,
    });

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

    const { contract } = await manifest.execute(input, {
      context,
      res,
      ...input,
    });
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

    const { contract } = await manifest.execute(input, {
      context,
      res,
      ...input,
    });
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
      await manifest.execute(input, { context, res, ...input });
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
      await manifest.execute(input, { context, res, ...input });
    } catch (error) {
      assert.equal(
        error.message,
        "[694d632f] Event is not defined on event types",
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

    const { contract } = await manifest.execute(input, {
      context,
      res,
      ...input,
    });

    assert(contract);
  });

  it("[d177ce53] it should execute an Error contract-type", async () => {
    const input = {} as Input;

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
      res,
      ...input,
    });

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

    const { contract } = await manifest.execute(input, {
      context,
      res,
      ...input,
    });

    assert(contract);
  });
  it("[5d6c5ca8] it should execute an plaidMethod contract-type when an id and a method keys exists in the definition", async () => {
    const input = {} as Input;
    const manifest = new Manifest(context, "manifestPlaidMethod", {
      key: "testContract",
      "*": new Contract({
        key: "testContract",
        raw: `{
          "method": "getLinkToken",
          "id": "asdasd",
          "payload": {}
        }`,
        type: "plaidMethod",
      }),
    });

    const { contract } = await manifest.execute(input, {
      context,
      res,
      ...input,
    });

    assert(contract);
  });
  it("[813a2d8a] it should execute an redisMethod contract-type when an id and a method keys exists in the definition", async () => {
    const input = {} as Input;
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
      {
        ...context,
        loadedPlugins: {
          ...context.loadedPlugins,
          redis: {
            instance: redisClient,
          },
        },
      },
      "manifestRedisMethod",
      {
        key: "testContract",
        "*": new Contract({
          key: "testContract",
          raw: `{
          "redisMethod": "getApplicationState",
          "key": "asdasd",
          "value": {}
        }`,
          type: "redisMethod",
        }),
      },
    );

    const { contract } = await manifest.execute(input, {
      context: {
        ...context,
        loadedPlugins: {
          ...context.loadedPlugins,
          redis: {
            instance: redisClient,
          },
        },
      },
      res,
      ...input,
    });

    assert(contract);
  });

  it("[5d6c5ca8] it should execute an Syllabus contract-type when an id and a method keys exists in the definition", async () => {
    const input = {} as Input;
    const manifest = new Manifest(context, "manifestSyllabus", {
      key: "testContract",
      "*": new Contract({
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
    });

    const { contract } = await manifest.execute(input, {
      context,
      res,
      ...input,
    });

    assert(contract);
  });

  it("[df40cd1a] it should execute an Syllabus contract-type when an id and a method keys exists in the definition", async () => {
    const input = {} as Input;
    const manifest = new Manifest(context, "manifestSyllabus", {
      key: "testContract",
      "*": new Contract({
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
    });

    const { contract } = await manifest.execute(input, {
      context,
      res,
      ...input,
    });

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

    const { contract } = await manifest.execute(input, {
      context,
      res,
      ...input,
    });

    assert(contract);
  });

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
    } as Input;

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

  it("[4r3ggwqq] it should execute an Neas-Request contract-type", async () => {
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
    } as Input;

    mock.method(neasServiceClient, "createAccountlessSession", () => {
      return "";
    });

    const manifest = new Manifest(context, "neas-request", {
      key: "neasRequest",
      "*": new Contract({
        key: "neasRequest",
        raw: `{
          "neastMethod": "createAccountlessSession"
        }`,
        type: "neasRequest",
      }),
    });

    const { contract } = await manifest.execute(input, {
      context,
      res,
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
    } as Input;

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

  it("[73147945] it should execute an Analytics contract-type", async () => {
    const input = {
      request: {
        method: "POST",
      },
    } as Input;

    mock.method(analyticsServiceClient, "track", () => {
      return true;
    });

    const manifest = new Manifest(context, "analytics", {
      key: "analytics",
      "*": new Contract({
        key: "analytics",
        raw: `{
          "event": "Viewed rate test",
          "type": "page",
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
  it("[5c3f53ea] it should execute an Analytics contract-type", async () => {
    const input = {
      request: {
        method: "POST",
      },
    } as Input;

    mock.method(analyticsServiceClient, "track", () => {
      return true;
    });

    const manifest = new Manifest(context, "analytics", {
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
  it("[ae226507] obj helper", async () => {
    const input = {} as Input;
    const manifest = new Manifest(context, "manifestTest", {
      "*": new Contract({
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
    });

    const { contract } = await manifest.execute(input, {
      context,
      res,
      ...input,
    });

    const parsed = JSON.parse(JSON.stringify(contract));

    assert.deepEqual(parsed, {
      testkey1: "testvalue1",
      testkeyArray: ["testvalue2", "testvalue3", "testvalue3-2"],
      testkeyArray2: ["testvalue4"],
    });
  });
  it("[ba9215d8] spread helper", async () => {
    const input = {} as Input;
    const manifest = new Manifest(context, "manifestTest", {
      "*": new Contract({
        raw: `
      {
        "testkey1": "testvalue1"
        {{#spread}}
          {"testkey2": "testvalue2", "testkey3": "testvalue3"}
        {{/spread}}
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
      testkey1: "testvalue1",
      testkey2: "testvalue2",
      testkey3: "testvalue3",
    });
  });
  it("[15d54c05] spread helper - empty definition", async () => {
    const input = {} as Input;
    const manifest = new Manifest(context, "manifestTest", {
      "*": new Contract({
        raw: `
      {
        "testkey1": "testvalue1"
        {{#spread}}
          null
        {{/spread}}
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
      testkey1: "testvalue1",
    });
  });
  it("[0cc7ae75] simple template helpers", async () => {
    const input = {
      request: {
        body: {
          values: {
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
          },
        },
      },
    } as unknown as Input;
    const manifest = new Manifest(context, "manifestTest", {
      "*": new Contract({
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
            "includes": {{{includes "1,2" "1"}}},
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
            "stateMinLoan": {{{stateMinLoan request.body.values.location}}},
            "hasValues": {{{hasValues request.body.values.dateOfBirth}}},
            "reachedTimeout": {{{reachedTimeout request.body.values.date 60000}}}
          }
      `,
      }),
      arreglo: new Contract({ key: "arreglo", raw: `["1", "2"]` }),
    });

    const { contract } = await manifest.execute(input, {
      context,
      res,
      ...input,
    });

    const parsed = JSON.parse(JSON.stringify(contract));

    assert.deepEqual(parsed, {
      equals: true,
      ne: false,
      lt: true,
      gt: false,
      lte: true,
      gte: false,
      not: false,
      notNull: false,
      includes: false,
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
    });
  });

  it("[6c19a4eb] mapIncomeType template helper", async () => {
    const input = {
      request: {
        body: {
          values: {
            EmployedIncomes: [
              {
                employer: "BigCompany",
                type: "employment",
              },
            ],
            FutureEmployedIncomes: [
              {
                employer: "BigCompany",
                type: "employment",
                title: "title",
                start: new Date().toISOString(),
              },
            ],
            SelfEmployedIncomes: [
              {
                type: "employment",
                title: "title",
                start: new Date().toISOString(),
              },
            ],
            UnemployedIncomes: [
              {
                type: "unspecified",
              },
            ],
            RetiredIncomes: [
              {
                type: "social_security_or_pension",
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
            "employed": "{{{mapIncomeTypeToEmplStatus request.body.values.EmployedIncomes}}}",
            "future": "{{{mapIncomeTypeToEmplStatus request.body.values.FutureEmployedIncomes}}}",
            "selfEmployed": "{{{mapIncomeTypeToEmplStatus request.body.values.SelfEmployedIncomes}}}",
            "unemployed": "{{{mapIncomeTypeToEmplStatus request.body.values.UnemployedIncomes}}}",
            "retired": "{{{mapIncomeTypeToEmplStatus request.body.values.RetiredIncomes}}}"
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
      employed: "employed",
      future: "future",
      selfEmployed: "self_employed",
      unemployed: "unemployed",
      retired: "retired",
    });
  });

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
    } as unknown as Input;
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
});
