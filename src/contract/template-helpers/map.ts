/* eslint-disable @typescript-eslint/no-unused-vars */
import assert from "node:assert";

const map: TemplateHelper = function (...args) {
  const elements = Array.isArray(args[0]) ? args[0] : [];
  const key =
    typeof args[1] === "string" ? args[1] : (undefined as string | undefined);

  assert(key);

  return elements.map((element, i) => {
    const pathParts = key.split(".");
    let cursor = element;

    for (const part of pathParts) {
      if (!(part in cursor)) {
        return null;
      }

      cursor = cursor[part];
    }

    return cursor;
  });
};

export default map;
