/* eslint-disable @typescript-eslint/no-unused-vars */
import assert from "node:assert";

const spread: TemplateHelper = function (context) {
  const objectDefinition = context.fn(this);
  const definition = JSON.parse(objectDefinition)
  let spreadJson = ``;
  if (definition) {
    Object.keys(definition).forEach((key, index) => {
      if (index <= Object.keys(definition).length) {
        spreadJson = `${spreadJson},`  
      }
      if (definition[key]) {
        spreadJson = `${spreadJson} "${key}": ${JSON.stringify(definition[key])}`
      }
    })
    return spreadJson;
  }
  return '';
};

export default spread;
