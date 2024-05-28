const findInArray = function (arr, property, value, return_property) {
  if (Array.isArray(arr) && property && return_property) {
    const item = arr.find((item) => item[property] === value);
    return item ? item[return_property] : null;
  }
};

export default findInArray;
