/* eslint-disable @typescript-eslint/no-unused-vars */

/**
 * Block helper that takes a newline separated list of objects and combines them
 * into a single object
 */
const obj: TemplateHelper = function (context) {
  const splitList = context.fn(this, context).trim().split("\n");
  const obj = {};

  const { include, exclude } = Object.keys(context.hash).reduce(
    (a, key) => {
      if (context.hash[key]) {
        return { ...a, include: [...a.include, key] };
      } else {
        return { ...a, exclude: [...a.exclude, key] };
      }
    },
    { include: [] as string[], exclude: [] as string[] },
  );

  splitList
    .filter((item) => Boolean(item.trim()))
    .forEach((item) => {
      const parsedItem = JSON.parse(item);

      if (!parsedItem || typeof parsedItem !== "object") return;

      Object.keys(parsedItem)
        .filter(
          (parsedItemKey) =>
            (!include.length || include.includes(parsedItemKey)) &&
            (!exclude.length || !exclude.includes(parsedItemKey)),
        )
        .forEach((parsedItemKey) => {
          const value = parsedItem[parsedItemKey];

          if (Array.isArray(obj[parsedItemKey])) {
            // Array concatenation
            if (Array.isArray(value)) {
              obj[parsedItemKey] = obj[parsedItemKey].concat(value);
            } else if (value !== null) {
              obj[parsedItemKey].push(value);
            }
          } else {
            if (obj[parsedItemKey] && value !== null) {
              obj[parsedItemKey] = [obj[parsedItemKey], value];
            } else {
              obj[parsedItemKey] = value;
            }
          }
        });
    });

  return JSON.stringify(obj) + "\n";
};

export default obj;
