import * as constants from "../constants.js";

/**
 * A special object type containing a "#" key mapped to a property path.
 * * The special property path traversal uses dot-separated path description
 *   to access any of the `input` parameters provided as part of contract execution
 * * A wildcard character ("*") property path will map across all elements of
 *   an array and return each as an array
 */
const inputReference: ContractReviver = function (input, manifest, key, value) {
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

    const formattedPathPart = pathPart.trim();

    cursor = cursor ? cursor[formattedPathPart] : inputs[formattedPathPart];

    if (!cursor) break;
  }

  return cursor;
};

export default inputReference;
