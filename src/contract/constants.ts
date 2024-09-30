export const DEFAULT_VERSION = "default";

export const ROOT_CONTRACT = "*";

/**
 * Sync contracts
 * 1. cannot be marked as a dependency by a neighbor
 * 2. can depend on neighboring contract keys
 * 3. is executed as soon as dependencies are resolved, then returned
 *
 */
export const SYNC_CONTRACT = "<";

/**
 * Async contracts
 * 1. cannot be marked as a dependency by a neighbor
 * 2. can depend on neighboring contract keys
 * 3. is executed as soon as dependencies are resolved, discarding the result
 */
export const ASYNC_CONTRACT = ">";

/**
 * In place of a contract reference, the value of a literal contract will always
 */
export const LITERAL_CONTRACT = "@";

export const RESERVED_CONTRACT_KEYS = {
  [ROOT_CONTRACT]: "@root",
  [SYNC_CONTRACT]: "@output",
  [ASYNC_CONTRACT]: "@async",
  [LITERAL_CONTRACT]: "@literal",
};

Object.freeze(RESERVED_CONTRACT_KEYS);

/* ============================== *
 * Regex
 * ============================== */
export const JSON_FILE_REGEX = /(?<!schema)\.json$/;
export const HANDLEBARS_FILE_REGEX = /(?<!schema)\.json(.handlebars)?$/;
export const SCHEMA_FILE_REGEX = /schema\.json$/;
export const SUBSTITUTION_SPLIT_REGEX =
  /(,?\s*{\s*"[$#@][^"]+"\s*:\s*"[^"]+"\s*}\s*)/;

export const SUBSTITUTION_COMPONENT_REGEX =
  /(,)?\s*{\s*"([$#@])([^"]+)"\s*:\s*"([^"]+)"\s*}/;

export const CONTRACT_SUBSTITUTION_REGEX =
  /([^":\[\]]+)(?:\:\:([^":\[\]]+))?(\[\])?/; //eslint-disable-line

export const REFERENCE_SUBSTITUTION_REGEX = /([^":\[\]]+)(?:\:\:([^":\[\]]+))?/; //eslint-disable-line

/* ============================== *
 * Collections
 * ============================== */
export enum ParameterFormat {
  uuid = "uuid",
  integer = "integer",
}

export const UUID_REGEX =
  /[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

export const INTEGER_REGEX = /^\d+$/;

export const manifestSchema = {
  type: "object",
  required: ["outputs"],
  properties: {
    parameters: {
      type: "array",
      items: {
        type: "object",
        properties: {
          key: {
            type: "string",
          },
          format: {
            type: "string",
          },
          required: {
            type: "boolean",
          },
        },
        required: ["key"],
      },
    },
    outputs: {
      type: "object",
      $ref: "#/$defs/contracts",
    },
    inputs: {
      type: "object",
      $ref: "#/$defs/contracts",
    },
  },
  $defs: {
    contracts: {
      type: "object",
      anyOf: [
        { required: [ROOT_CONTRACT] },
        { required: [SYNC_CONTRACT] },
        { required: [LITERAL_CONTRACT] },
      ],
      properties: {
        [LITERAL_CONTRACT]: {
          type: ["object", "string", "number", "boolean", "array", "null"],
        },
      },
      additionalProperties: {
        anyOf: [
          { type: "string" },
          { $ref: "#/$defs/contracts" },
          { type: "object" },
          {
            type: "array",
            items: {
              anyOf: [{ type: "string" }, { $ref: "#/$defs/contracts" }],
            },
          },
        ],
      },
    },
  },
};
