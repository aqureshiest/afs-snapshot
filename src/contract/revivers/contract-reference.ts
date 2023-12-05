import * as constants from "../constants.js";
import Contract from "../contract.js";

import reviver from "./reviver.js";

/**
 * A special object type containing a "$" key mapped to a decorated contract key
 * * The key points to one or more contracts assigned to the manifest under that
 *   identifier.
 * * An optional type cast decorator will allow that contract type to transform
 *   its output into a different format appropriate for where it's being used
 * * An optional array decorator will guarantee that the result of this is
 *   always an array, regardless of how many contracts are linked (or none at all)
 * * As a single value, this replacement will return the result of the first
 *   contract, or `null` if none are matched
 * * TODO: should single values be rejected if more than one contract is
 *   found for a single expected value?
 */
const contractReference: ContractReviver = function (
  input,
  manifest,
  key,
  value,
) {
  const substitutionKey = value[constants.CONTRACT_SUBSTITUTION_SYMBOL];

  const [, contractKey, coercion, array] =
    constants.CONTRACT_SUBSTITUTION_REGEX.exec(substitutionKey) || [];

  if (contractKey in manifest.contracts) {
    const parsed = manifest.contracts[contractKey].map(
      (subContract: Contract) => {
        return subContract.execute(
          reviver.bind(null, input, manifest),
          input,
          coercion,
        );
      },
    );

    return !array && parsed.length < 2 ? parsed[0] : parsed;
  }

  return array ? [] : null;
};

export default contractReference;
