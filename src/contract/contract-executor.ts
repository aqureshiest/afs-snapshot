/* eslint-disable @typescript-eslint/no-unused-vars */
import * as constants from "./constants.js";
import ContractType, * as contractTypes from "./contract-types/index.js";

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

/**
 * A special object type containing a "&" key mapped to an array
 * Any child members of the array that are, themselves, arrays will be flattened
 * and this special concatenate object will be replaced with the flattened array
 */
const concatenate: ContractReviver = function (input, manifest, key, value) {
  const concatenationArray = value[constants.CONCATENATION_SYMBOL];

  if (concatenationArray.every((value) => typeof value === "string")) {
    return concatenationArray.join("");
  }

  return concatenationArray.reduce((flattenedArray, subValue) => {
    if (subValue == null) return flattenedArray;
    return Array.isArray(subValue)
      ? [...flattenedArray, ...subValue]
      : [...flattenedArray, subValue];
  }, []);
};

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
const contract: ContractReviver = function (
  input,
  manifest,
  key,
  value: string,
) {
  const substitutionKey = value[constants.CONTRACT_SUBSTITUTION_SYMBOL];

  const [, contractKey, coercion, array] =
    constants.REFERENCE_SUBSTITUTION_REGEX.exec(substitutionKey) || [];

  if (contractKey in manifest) {
    const parsed = manifest[contractKey].map((subContract, i) => {
      const subParsed = JSON.parse(
        subContract.definition,
        reviver.bind(null, input, manifest),
      );

      const contractType =
        contractTypes[subContract.type] || contractTypes.identity;
      const contractMethod =
        contractType[subContract.type] || contractType.identity;

      const executedContract = contractMethod(subParsed);

      subContract.output = executedContract;

      if (coercion && coercion in contractType) {
        return contractType[coercion](executedContract);
      }

      return executedContract;
    });

    return !array && parsed.length < 2 ? parsed[0] : parsed;
  }

  return array ? [] : null;
};

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
const embeddedContract: ContractReviver<ContractSubstitution> = function (
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

  const contractType = contractTypes[type] || contractTypes.identity;
  const contractMethod = contractType[type] || contractType.identity;

  const executedContract = contractMethod(definition);

  if (coercion && coercion in contractType) {
    return contractType[coercion](executedContract);
  }

  return executedContract;
};

/**
 * A special object type containing a "#" key mapped to a property path.
 * * The special property path traversal uses dot-separated path description
 *   to access any of the `input` parameters provided as part of contract execution
 * * A wildcard character ("*") property path will map across all elements of
 *   an array and return each as an array
 */
const reference: ContractReviver = function (input, manifest, key, value) {
  const substitutionKey = value[constants.REFERENCE_SUBSTITUTION_SYMBOL];

  const [, referenceKey] =
    constants.CONTRACT_SUBSTITUTION_REGEX.exec(substitutionKey) || [];

  const traversed = traverseReference(input, referenceKey);

  return traversed || null;
};

/**
 * Given an object and a property path, progressively access each property in
 * the path to return a deeply nested property.
 * * Wildcard characters ("*") will map remaining property paths across all
 *   members of an array or all keys of an object, returning them as an array
 * * TODO: JQ style
 */
const traverseReference = (inputs: object, key: string) => {
  const pathParts = key.split(".");

  let cursor;

  while (pathParts.length) {
    const pathPart = pathParts.shift();

    if (!pathPart) break;

    if (pathPart === constants.WILD_CARD_SYMBOL) {
      const remainingPathParts = pathParts.join(".");

      return Array.isArray(cursor)
        ? cursor.map((subCursor) =>
            traverseReference(subCursor, remainingPathParts),
          )
        : Object.keys(cursor).map((subCursorKey) =>
            traverseReference(cursor[subCursorKey], remainingPathParts),
          );
    }

    cursor = cursor ? cursor[pathPart] : inputs[pathPart];

    if (!cursor) break;
  }

  return cursor;
};

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
  }

  if (Array.isArray(rawValue)) {
    return rawValue.map((subValue, i) =>
      reviver.call(rawValue, input, manifest, i, subValue),
    );
  }

  return rawValue;
};

/**
 * Combines the input with a manifest to produce a transformed JSON object
 */
const contractExecutor: ContractExecutor = (
  input,
  manifest,
  contract = manifest["*"],
) => {
  if (Array.isArray(contract)) {
    return contract.map((subContract) =>
      contractExecutor(input, manifest, subContract),
    );
  }

  const revived = JSON.parse(
    contract.definition,
    reviver.bind(null, input, manifest),
  );

  /* ============================== *
   * TODO: perform ajv contract validation while it's still a string for
   * added performance (wow!)
   * ============================== */

  return revived;
};

export default contractExecutor;
