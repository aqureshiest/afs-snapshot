/* eslint-disable @typescript-eslint/no-unused-vars */

/**
 * Block helper that takes a newline separated list of objects and combines them
 * into a single object
 */
const obj: TemplateHelper = function (context) {
  const splitList = context.fn(this, context).trim().split("\n");
  const obj = {};

  splitList
    .filter((item) => Boolean(item.trim()))
    .forEach((item) => {
      const parsedItem = JSON.parse(item);

      if (!parsedItem || typeof parsedItem !== "object") return;

      Object.keys(parsedItem).forEach((parsedItemKey) => {
        if (obj[parsedItemKey] === undefined) {
          obj[parsedItemKey] = parsedItem[parsedItemKey];
        } else {
          if (Array.isArray(obj[parsedItemKey])) {
            if (Array.isArray(parsedItem[parsedItemKey])) {
              obj[parsedItemKey] = obj[parsedItemKey].concat(
                parsedItem[parsedItemKey],
              );
            } else {
              obj[parsedItemKey].push(parsedItem[parsedItemKey]);
            }
          }
        }
      });
    });

  return JSON.stringify(obj) + "\n";
};

export default obj;
