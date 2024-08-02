/* eslint-disable @typescript-eslint/no-unused-vars */
import assert from "node:assert";

/**
 * Block helper that takes a valid JSON object and spreads it to an encapsulating object
 */
const spread: TemplateHelper = function (context) {
  const objectDefinition = context.fn(this);
  const definition = JSON.parse(objectDefinition);
  let spreadJson = ``;
  if (definition) {
    Object.keys(definition).forEach((key, index) => {
      if (index <= Object.keys(definition).length) {
        spreadJson = `${spreadJson},`;
      }
      if (definition[key] !== null) {
        spreadJson = `${spreadJson} "${key}": ${JSON.stringify(
          definition[key],
        )}`;
      }
    });
    return spreadJson;
  }
  return "";
};

export default spread;
