/* eslint-disable @typescript-eslint/no-unused-vars */
import * as constants from "../constants.js";
import * as contractTypes from "../contract-types/index.js";

import operation from "./operation.js";
import concatenate from "./concatenate.js";
import contract from "./contract-reference.js";
import reference from "./input-reference.js";
import rememberReference from "./remember-reference.js";
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
  if (
    rawValue != null &&
    typeof rawValue === "object" &&
    !Array.isArray(rawValue)
  ) {
    const {
      [constants.SPREAD_SYMBOL]: rawSpreadValues,
      [constants.COMMENT_SYMBOL]: comment,
      ...unspreadValue
    } = rawValue;

    // TODO: this double ternary is obnoxious
    const spreadValue = Array.isArray(rawSpreadValues)
      ? rawSpreadValues.reduce(
          (accumulator, rawSpreadValue, i) => ({
            ...accumulator,
            ...reviver.call(this, input, manifest, i, rawSpreadValue),
          }),
          {},
        )
      : rawSpreadValues
      ? reviver.call(this, input, manifest, null, rawSpreadValues)
      : {};

    const value = { ...unspreadValue, ...spreadValue };

    if (input && constants.OPERATION_SYMBOL in value) {
      return operation.call(this, input, manifest, key, value);
    }

    if (input && constants.CONCATENATION_SYMBOL in value) {
      return concatenate.call(this, input, manifest, key, value);
    }

    if (constants.REFERENCE_SUBSTITUTION_SYMBOL in value) {
      return input
        ? reference.call(this, input, manifest, key, value)
        : rememberReference.call(this, input, manifest, key, value);
    }

    if (constants.CONTRACT_SUBSTITUTION_SYMBOL in value) {
      return typeof value[constants.CONTRACT_SUBSTITUTION_SYMBOL] === "string"
        ? contract.call(this, input, manifest, key, value)
        : embeddedContract.call(this, input, manifest, key, value);
    }

    if (input && constants.AND_CONTRACT in value) {
      const { coercion } = value;
      return embeddedContract.call(this, input, manifest, key, {
        "@": "and",
        coercion,
        $: value[constants.AND_CONTRACT],
      });
    }

    if (input && constants.OR_CONTRACT in value) {
      const { coercion } = value;
      return embeddedContract.call(this, input, manifest, key, {
        "@": "or",
        coercion,
        $: value[constants.OR_CONTRACT],
      });
    }

    if (input && constants.NOT_CONTRACT in value) {
      const { coercion } = value;
      return embeddedContract.call(this, input, manifest, key, {
        "@": "not",
        coercion,
        $: value[constants.NOT_CONTRACT],
      });
    }
    return value;
  }

  if (Array.isArray(rawValue)) {
    return rawValue.map((subValue, i) =>
      reviver.call(rawValue, input, manifest, i, subValue),
    );
  }

  return rawValue;
};

export default reviver;
