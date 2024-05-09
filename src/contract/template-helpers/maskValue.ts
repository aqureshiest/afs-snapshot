/* eslint-disable @typescript-eslint/no-unused-vars */
import assert from "node:assert";

const maskValue: TemplateHelper = function (...args) {
  const [type, data] = args;
  assert(typeof type === "string");

  if (data && type === "ssn") {
    const mask1 = data.substring(0, 3).replace(/\d/g, "*");
    const mask2 = data.substring(3, 5).replace(/\d/g, "*");
    const last4 = data.substring(data.length - 4);
    const maskedSsn = mask1 + "-" + mask2 + "-" + last4;
    return maskedSsn;
  }
  return;
};

export default maskValue;
