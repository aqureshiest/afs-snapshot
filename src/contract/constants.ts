/* ============================== *
 * Substitution symbols
 * ============================== */

export const CONTRACT_SUBSTITUTION_SYMBOL = "$";
export const REFERENCE_SUBSTITUTION_SYMBOL = "#";
export const CONCATENATION_SYMBOL = "&";
export const OPERATION_SYMBOL = "%";
export const MAPPING_SYMBOL = "@";
export const WILD_CARD_SYMBOL = "*";
export const COMMENT_SYMBOL = "?";

/* ============================== *
 * Regex
 * ============================== */
export const JSON_FILE_REGEX = /\.json$/;

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

export enum SUBSTITUTION_STRATEGY {
  SINGLE = "#",
  ARRAY = "$",
  VARIADIC = "@",
}

export const FORBIDDEN_GLOBALS = [
  "process",
  "crypto",
  "readline",
  "tty",
  "require",
  "console",
  "setTimeout",
  "setInterval",
];
