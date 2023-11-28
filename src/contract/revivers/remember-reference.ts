import * as constants from "../constants.js";

import Reference from "../reference.js";

/**
 * A special object type containing a "#" key mapped to a property path.
 * * The special property path traversal uses dot-separated path description
 *   to access any of the `input` parameters provided as part of contract execution
 * * A wildcard character ("*") property path will map across all elements of
 *   an array and return each as an array
 */
const rememberReference: ContractReviver = function (
  input,
  manifest,
  key,
  value,
) {
  const substitutionKey = value[constants.REFERENCE_SUBSTITUTION_SYMBOL];

  return new Reference(substitutionKey);
};

export default rememberReference;
