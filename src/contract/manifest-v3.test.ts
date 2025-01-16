import { before, describe, it, mock } from "node:test";
import assert from "node:assert";
import { Response } from "express";

import createPluginContext from "@earnest-labs/microservice-chassis/createPluginContext.js";
import registerChassisPlugins from "@earnest-labs/microservice-chassis/registerChassisPlugins.js";
import readJsonFile from "@earnest-labs/microservice-chassis/readJsonFile.js";

import Contract from "./contract.js";
import Manifest from "./manifest.js";
import RedisClient from "../clients/redis/index.js";

describe("[4525f9a8] manifest 3.0", () => {
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

  describe("[2041d3e4] dynamic referencing", () => {
    /* ============================== *
     * Guarantees the behavior of the following auxiliary reference array access
     * properties:
     *   @previous: allows a reference to a neighboring contract from within
     *     an array at any depth
     *   @last: allows a reference to the final contract in an array of references
     * ============================== */

    it("[14b90938] positional referencing with async dependencies", async () => {
      const manifest = new Manifest(
        "14b90938",
        {
          "*": "total",
          accumulate: [
            { "*": "accumulate", add: { "@": 1 } },
            { "*": "accumulate", add: { "@": 10 } },
            { "*": "accumulate", add: { "@": 100 } },
            { "*": "accumulate", add: { "@": 1000 } },
          ],
        },
        {
          total: {
            default: new Contract({
              raw: `{{{json @ref.accumulate.[@last]}}}`,
            }),
          },
          accumulate: {
            default: new Contract({
              type: "noop",
              raw: `
                {{{json (sum @ref.accumulate.[@previous] @ref.add)}}}`,
            }),
          },
        },
      );

      const result = await manifest.execute(context, {});

      assert.equal(result.toJSON(), 1111);
    });

    /* ============================== *
     * Guarantees that various template helpers that operate with arrays
     * do not get tripped up by arrays of evaluation proxies
     * ============================== */

    it("[49d1d883] referencing neighbors of parents", async () => {
      const manifest = new Manifest(
        "49d1d883",
        {
          "*": "components",
          A: {
            "*": "component",
            name: {
              "@": "contained",
            },
            B: {
              "*": "component",
              name: {
                "@": "isolated",
              },
            },
          },
          B: {
            "*": "component",
            name: { "@": "neighbor" },
          },
        },
        {
          components: {
            default: new Contract({
              raw: `{ "A": {{{json @ref.A}}}, "B": {{{json @ref.B}}} }`,
            }),
          },
          component: {
            default: new Contract({
              raw: `{
                "name": {{{json @ref.name}}},
                "A": {{{json @ref.A.name}}},
                "B": {{{json @ref.B.name}}}
              }`,
            }),
          },
        },
      );

      const result = await manifest.execute(context, {});

      const { A: aComponent, B: bComponent } = result.toJSON() as {
        [key: string]: { A: string | null; B: string | null; name: string };
      };

      assert.equal(
        aComponent.name,
        "contained",
        "Component A should be named 'contained'",
      );
      assert.equal(
        aComponent.A,
        null,
        "Component A should not be able to reference itself",
      );
      assert.equal(
        aComponent.B,
        "isolated",
        "Component A should be referencing component B in its own Scope",
      );

      assert.equal(
        bComponent.name,
        "neighbor",
        "Component A should be named 'neighbor'",
      );
      assert.equal(
        bComponent.A,
        "contained",
        "Component B should be able to reference external Component A",
      );
      assert.equal(
        bComponent.B,
        null,
        "Component B should not be able to reference itself",
      );
    });

    /* ============================== *
     * Guarantees that various template helpers that operate with arrays
     * do not get tripped up by arrays of evaluation proxies
     * ============================== */

    it("[8da9d736] references can be comprehended as lists", async () => {
      const manifest = new Manifest(
        "8da9d736",
        {
          "*": "includes",
          some: [{ "@": null }, { "@": "B" }, { "@": "C" }],
          every: [{ "@": true }, { "@": 100 }, { "@": "yes" }],
          none: [{ "@": null }, { "@": false }, { "@": 0 }],
        },
        {
          includes: {
            default: new Contract({
              raw: `{
                "positive": {{{ json (includes @ref.some "C") }}},
                "negative": {{{ json (includes @ref.some "A") }}},
                "coalesced": {{{ json (coalesce @ref.some) }}},
                "allPositive": {{{ json (and @ref.every) }}},
                "allNegative1": {{{ json (and @ref.some) }}},
                "allNegative2": {{{ json (and @ref.none) }}},
                "somePositive1": {{{ json (or @ref.every) }}},
                "somePositive2": {{{ json (or @ref.some) }}},
                "someNegative": {{{ json (or @ref.none) }}}
              }`,
            }),
          },
        },
      );

      const result = (await manifest.execute(context, {})).toJSON() as {
        [key: string]: boolean | string | null | boolean;
      };

      assert.equal(
        result.positive,
        true,
        "Could not use a reference array as a list",
      );
      assert.equal(result.negative, false, "False positive");
      assert.equal(
        result.coalesced,
        "B",
        "Did not coalesce the first non-falsy value",
      );
      assert.equal(
        result.allPositive,
        true,
        "Did not count referenced contracts as all truthy",
      );
      assert.equal(
        result.allNegative1,
        false,
        "False positive counting all referenced contracts as truthy",
      );
      assert.equal(
        result.allNegative2,
        false,
        "False positive counting all referenced contracts as truthy",
      );

      assert.equal(
        result.somePositive1,
        true,
        "Did not count referenced contracts as partially truthy",
      );
      assert.equal(
        result.somePositive2,
        true,
        "Did not count referenced contracts as partially truthy",
      );
      assert.equal(
        result.someNegative,
        false,
        "False positive counting referenced contracts as partially truthy",
      );
    });

    /* ============================== *
     * Guarantees that references that are only exposed by conditions that
     * are revealed by other contract references will be correctly added to
     * the list of dependencies and evaluated
     * ============================== */

    it("[8d0b9ea8] references can be included in nested conditionals", async () => {
      const manifest = new Manifest(
        "8d0b9ea8",
        {
          "*": "composed",
          amount: "asyncInputAmount",
          gold: { "<": "asyncMedal", medal: { "@": "gold" } },
          silver: { "<": "asyncMedal", medal: { "@": "silver" } },
          bronze: { "<": "asyncMedal", medal: { "@": "bronze" } },
          iron: { "<": "asyncMedal", medal: { "@": "iron" } },
        },
        {
          composed: {
            default: new Contract({
              raw: `
                {{#if (gt @ref.amount 1000) }}
                  {{{ json @ref.gold }}}
                {{else if (gt @ref.amount 750) }}
                  {{{ json @ref.silver }}}
                {{else if (gt @ref.amount 500) }}
                  {{{ json @ref.bronze }}}
                {{else}}
                  {{{ json @ref.iron }}}
                {{/if}}
              `,
            }),
          },
          asyncInputAmount: {
            default: new Contract({
              type: "noop",
              raw: `{{{ json amount }}}`,
            }),
          },
          asyncMedal: {
            default: new Contract({
              type: "noop",
              raw: `{{{ json @ref.medal }}}`,
            }),
          },
        },
      );

      {
        const result = (
          await manifest.execute(context, { amount: 1300 })
        ).toJSON() as string;
        assert.equal(
          result,
          "gold",
          "Failed to obtain correct nested contract reference",
        );
      }

      {
        const result = (
          await manifest.execute(context, { amount: 900 })
        ).toJSON() as string;
        assert.equal(
          result,
          "silver",
          "Failed to obtain correct nested contract reference",
        );
      }

      {
        const result = (
          await manifest.execute(context, { amount: 600 })
        ).toJSON() as string;
        assert.equal(
          result,
          "bronze",
          "Failed to obtain correct nested contract reference",
        );
      }

      {
        const result = (
          await manifest.execute(context, { amount: 400 })
        ).toJSON() as string;
        assert.equal(
          result,
          "iron",
          "Failed to obtain correct nested contract reference",
        );
      }

      {
        const result = (
          await manifest.execute(context, { amount: null })
        ).toJSON() as string;
        assert.equal(
          result,
          "iron",
          "Failed to obtain default nested contract reference",
        );
      }
    });

    /* ============================== *
     * Guarantees that handlebars can handle references to contract keys
     * that include deep property references, even when needing to evaluate
     * multiple contracts in order to resolve them
     * ============================== */

    it("[6919990c] safely allows deep references to async contract references", async () => {
      const manifest = new Manifest(
        "6919990c",
        {
          "<": "deepReference",
          composed: {
            "<": "composed",
            property: { "@": "top" },
            value: {
              "<": "composed",
              property: { "@": "inner" },
              value: {
                "<": "composed",
                property: { "@": "middle" },
                value: {
                  "<": "composed",
                  property: { "@": "bottom" },
                  value: {
                    "@": "qwijibo",
                  },
                },
              },
            },
          },
        },
        {
          deepReference: {
            default: new Contract({
              raw: `{{{ json @ref.composed.top.inner.middle.bottom }}}`,
            }),
          },
          composed: {
            default: new Contract({
              type: "noop",
              raw: `{ "{{@ref.property}}": {{{ json @ref.value }}} }`,
            }),
          },
        },
      );

      {
        const instance = await manifest.execute(context, {});
        const result = instance.toJSON();

        assert.equal(
          result,
          "qwijibo",
          "Failed to obtain correct deeply nested contract reference",
        );
      }
    });

    /* ============================== *
     * Guarantees that handlebars can handle references to contract
     * keys that are arrays of references in the following ways:
     * 1. the array functions fully as an iterator, returning
     *    each of the scoped contract references
     * 2. accessing own properties of the array functions as expected
     * ============================== */

    it("[78c5de46] allows iteration and array methods on reference lists", async () => {
      const manifest = new Manifest(
        "78c5de46",
        {
          "<": "combine",
          list: [
            { "@": { key: "a", value: 1 } },
            { "@": { key: "b", value: 2 } },
            { "@": { key: "c", value: 3 } },
          ],
        },
        {
          combine: {
            default: new Contract({
              raw: `{
                {{#each @ref.list}}
                  "{{key}}": {{{ json value }}},
                {{/each}}
                "length": {{{ @ref.list.length }}}
              }`,
            }),
          },
        },
      );

      const instance = await manifest.execute(context, {});
      const result = instance.toJSON() as { [key: string]: number };

      assert.equal(result?.a, 1);
      assert.equal(result?.b, 2);
      assert.equal(result?.c, 3);
      assert.equal(
        result?.length,
        3,
        "Could not access the length of the reference array",
      );
    });

    it("[bb94c2d9] comprehends contracts as conditionals", async () => {
      const manifest = new Manifest(
        "bb94c2d9",
        {
          "<": "combine",
          a: { "@": true },
          b: { "@": null },
          c: { "@": true },
          d: { "@": false },
        },
        {
          combine: {
            default: new Contract({
              raw: `{
                "a": {{#if @ref.a}}true{{else}}false{{/if}},
                "b": {{#if @ref.b}}true{{else}}false{{/if}},
                "c": {{#if (contract 'c')}}true{{else}}false{{/if}},
                "d": {{#if (contract 'd')}}true{{else}}false{{/if}}
              }`,
            }),
          },
        },
      );

      const instance = await manifest.execute(context, {});
      const result = instance.toJSON() as { [key: string]: boolean };

      assert.equal(
        result?.a,
        true,
        "contract referenced with @ref was not considered truthy",
      );
      assert.equal(
        result?.b,
        false,
        "contract referenced with @ref was not considered falsy",
      );
      assert.equal(
        result?.c,
        true,
        "contract referenced with template helper was not considered truthy",
      );
      assert.equal(
        result?.d,
        false,
        "contract referenced with template helper was not considered falsy",
      );
    });
  });
});
