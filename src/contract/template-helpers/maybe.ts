/* eslint-disable @typescript-eslint/no-unused-vars */
import assert from "node:assert";

/**
 * Block helper that takes a valid JSON object and spreads it to an encapsulating object
 */
const maybe = function (a1, a2) {
  const rv = a1 || a2;
  return rv;
};

export default maybe;
