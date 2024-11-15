export const isArray = (arr) => Array.isArray(arr);

const findInArray = function (...args) {
  const [arr, property, value, return_property] = args;
  const context = args[args.length - 1].data.context;
  let parsedArray;
  try {
    /**
     * arr is being passed in as a string representation of the array
     * via (contract 'getDegrees') in the handlebars definition
     * We need to convert it back to an actual array
     */
    parsedArray = JSON.parse(arr);
  } catch (ex) {
    context.logger.error({
      message: `[0c9c170f] ${ex.message}`,
      error: ex,
    });
  }

  if (Array.isArray(parsedArray) && property && return_property) {
    const item = parsedArray.find((item) => item[property] === value);
    return item ? item[return_property] : null;
  }
};

export default findInArray;
