export const DEFAULT_VERSION = "default";
export const ROOT_CONTRACT = "*";
/* ============================== *
 * Substitution symbols
 * ============================== */

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
      required: ["*"],
      additionalProperties: {
        anyOf: [
          { type: "string" },
          { $ref: "#/$defs/contracts" },
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
