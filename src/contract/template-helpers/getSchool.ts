/* eslint-disable @typescript-eslint/no-unused-vars */
import assert from "node:assert";

const getSchool: TemplateHelper = function (opeid, schools) {
  assert(typeof opeid === "string");
  if (schools) {
    return schools.find((school) => school.opeid8 === opeid);
  }
};

export default getSchool;
