/* eslint-disable @typescript-eslint/no-unused-vars */
import * as constants from "../constants.js";
import * as contractTypes from "../contract-types/index.js";

import operation from "./operation.js";
import concatenate from "./concatenate.js";
import contract from "./contract-reference.js";
import reference from "./input-reference.js";
import embeddedContract from "./embedded-contract.js";

/**
 * JSON.parse reviver that looks for special object types as instructions for
 * how to process it.
 */
const reviver: ContractReviver = function (
  input,
  manifest,
  key: string,
  rawValue: ContractSubstitution,
) {
  if (rawValue != null && typeof rawValue === "object") {
    const { [constants.COMMENT_SYMBOL]: comment, ...value } = rawValue;

    if (constants.OPERATION_SYMBOL in value) {
      return operation.call(this, input, manifest, key, value);
    }

    if (constants.CONCATENATION_SYMBOL in value) {
      return concatenate.call(this, input, manifest, key, value);
    }

    if (constants.REFERENCE_SUBSTITUTION_SYMBOL in value) {
      return reference.call(this, input, manifest, key, value);
    }

    if (constants.CONTRACT_SUBSTITUTION_SYMBOL in value) {
      return typeof value[constants.CONTRACT_SUBSTITUTION_SYMBOL] === "string"
        ? contract.call(this, input, manifest, key, value)
        : embeddedContract.call(this, input, manifest, key, value);
    }

    if (constants.AND_CONTRACT in value) {
      const { coercion } = value;
      return embeddedContract.call(this, input, manifest, key, {
        "@": "and",
        coercion,
        $: value[constants.AND_CONTRACT],
      });
    }

    if (constants.OR_CONTRACT in value) {
      const { coercion } = value;
      return embeddedContract.call(this, input, manifest, key, {
        "@": "or",
        coercion,
        $: value[constants.OR_CONTRACT],
      });
    }

    if (constants.NOT_CONTRACT in value) {
      const { coercion } = value;
      return embeddedContract.call(this, input, manifest, key, {
        "@": "not",
        coercion,
        $: value[constants.NOT_CONTRACT],
      });
    }
  }

  if (Array.isArray(rawValue)) {
    return rawValue.map((subValue, i) =>
      reviver.call(rawValue, input, manifest, i, subValue),
    );
  }

  return rawValue;
};

export default reviver;
