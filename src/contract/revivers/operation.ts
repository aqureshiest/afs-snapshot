import * as constants from "../constants.js";

/**
 * A special object type containing a "%" key mapped to an array of terms
 * that, once expanded to their execution values, will be executed as a
 * regular statement
 * * Strict governance of these operations will ensure that they can't abusive
 *   behavior can't be encoded into them
 * * If an "@" symbol is included in the object, the function will be evaluated
 *   once each substituting
 *
 *   TODO: this is the diciest of the reviving functions, due to ACE, so we should
 *   investigate alternative strategies for enabling complex logic / operations
 *   that do not sacrifice functionality
 *
 */
const operation: ContractReviver = function (input, manifest, key, value) {
  const operationArray = value[constants.OPERATION_SYMBOL];
  let eachValue = value[constants.MAPPING_SYMBOL];

  const termsArray = operationArray.reduce((a, b) => {
    if (b != null && typeof b === "object") {
      b = JSON.stringify(b);
    }

    if (typeof b === "string" && b.includes(constants.MAPPING_SYMBOL)) {
      if (eachValue != null && typeof eachValue === "object") {
        eachValue = JSON.stringify(eachValue);
      }

      b = b.replace(constants.MAPPING_SYMBOL, eachValue);
    }

    return [...a, b];
  }, []);

  const functionBody = `return ${termsArray.join(" ")}`;

  return new Function(...constants.FORBIDDEN_GLOBALS, functionBody)();
};

export default operation;
