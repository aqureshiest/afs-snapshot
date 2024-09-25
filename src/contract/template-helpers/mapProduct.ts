/* eslint-disable @typescript-eslint/no-unused-vars */

const productMap = {
  "student-refi": "slr",
  "student-loan-refi": "slr",
  "student-loan": "slo",
};
const mapProduct = function (applyProduct) {
  if (productMap[applyProduct]) {
    return productMap[applyProduct];
  } else {
    return applyProduct;
  }
};

const getProductName = function (acronym) {
  for (const [key, val] of Object.entries(productMap)) {
    if (val === acronym) {
      return key;
    }
  }
  return undefined;
};

export { getProductName, mapProduct };
