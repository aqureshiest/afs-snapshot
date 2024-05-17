/* eslint-disable @typescript-eslint/no-unused-vars */

const productMap = {
  "student-refi": "slr",
  "student-loan": "slo",
};
const mapProduct = function (applyProduct) {
  if (productMap[applyProduct]) {
    return productMap[applyProduct];
  } else {
    return applyProduct;
  }
};

export default mapProduct;
