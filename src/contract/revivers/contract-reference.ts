import * as constants from "../constants.js";
import * as contractTypes from "../contract-types/index.js";

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
const contractReference: ContractReviver<keyof typeof contractTypes> =
  function (input, manifest, key, value) {
    const substitutionKey = value[constants.CONTRACT_SUBSTITUTION_SYMBOL];

    const [, contractKey, coercion, array] =
      constants.REFERENCE_SUBSTITUTION_REGEX.exec(substitutionKey) || [];

    if (contractKey in manifest) {
      const parsed = manifest[contractKey].map((subContract) => {
        const subParsed = JSON.parse(
          subContract.definition,
          reviver.bind(null, input, manifest),
        );

        const ContractType =
          contractTypes[
            subContract.type as Exclude<
              keyof typeof contractTypes,
              "ContractType" | "MutationType"
            >
          ] || contractTypes.identity;

        const contractInstance = new ContractType(subParsed, input);

        if (coercion) {
          contractInstance.coerce(coercion);
        }

        /* ============================== *
         * A. If the contract instance is a MutationType, return it as-is
         * for future processing
         * B. Otherwise, execute the contract
         * ============================== */
        return contractInstance instanceof contractTypes.MutationType
          ? contractInstance
          : contractInstance.toJSON();
      });

      return !array && parsed.length < 2 ? parsed[0] : parsed;
    }

    return array ? [] : null;
  };

export default contractReference;
