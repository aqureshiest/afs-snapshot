import * as constants from "../constants.js";

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

export default concatenate;
