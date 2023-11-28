import * as constants from "../constants.js";
import * as contractTypes from "../contract-types/index.js";

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
const embeddedContract: ContractReviver<keyof typeof contractTypes> = function (
  input,
  manifest,
  key,
  value,
) {
  const {
    [constants.CONTRACT_SUBSTITUTION_SYMBOL]: definition,
    [constants.MAPPING_SYMBOL]: type,
    coercion,
  } = value;

  const ContractType =
    contractTypes[type as ContractType] || contractTypes.identity;

  const contractInstance = new ContractType(definition, input);

  if (coercion) {
    contractInstance.coerce(coercion);
  }

  return contractInstance instanceof contractTypes.MutationType
    ? contractInstance
    : contractInstance.toJSON();
};

export default embeddedContract;
