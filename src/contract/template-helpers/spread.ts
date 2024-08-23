/* eslint-disable @typescript-eslint/no-unused-vars */
import assert from "node:assert";

/**
 * Block helper that takes a valid JSON object and spreads it to an encapsulating object
 */
const spread: TemplateHelper = function (context) {
  const options = context.hash;
  const { leadingComma, trailingComma } = options;
  const objectDefinition = context.fn(this);
  const definition = JSON.parse(objectDefinition);
  let spreadJson = ``;
  if (definition) {
    Object.keys(definition).forEach((key, index) => {
      /**
       * Comma Logic
       * - If there are multiple keys, add a comma after each key except the last one
       * - If there is only one key, add a comma based on the trailingComma option
       * - If leadingComma is true, add a comma before the first key
       */
      const multipleKeys = Object.keys(definition).length > 1;
      const isLastKey = index === Object.keys(definition).length - 1;
      let addTrailingComma = true;
      if (multipleKeys && !isLastKey) {
        addTrailingComma = true;
      }
      if (multipleKeys && isLastKey) {
        addTrailingComma = trailingComma;
      }
      if (leadingComma) {
        spreadJson = `${spreadJson},`;
      }

      if (definition[key] !== null) {
        spreadJson = `${spreadJson} "${key}": ${JSON.stringify(
          definition[key],
        )}${addTrailingComma ? "," : ""}`;
      }
    });
    return spreadJson;
  }
  return "";
};

export default spread;
