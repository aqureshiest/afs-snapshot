/* eslint-disable @typescript-eslint/no-unused-vars */

const obj: TemplateHelper = function (context) {
  const splitList = context.fn(this).trim().split("\n");
  const obj = {};

  splitList.forEach((item) => {
    // console.log('[ff9d29] AJ DEBUG item', JSON.stringify(item, null, 2));
    
    if (item) {
      const parsedItem = JSON.parse(item);
  
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
    }
  });
  // console.log('[3c8b61] AJ DEBUG obj', JSON.stringify(obj, null, 2));
  
  return `${JSON.stringify(obj)}`;
};

export default obj;
