/* eslint-disable @typescript-eslint/no-unused-vars */
import assert from "node:assert";

const list: TemplateHelper = function (context) {
  const { merge } = context.hash;

  const splitList = context.fn(this).trim().split("\n");

  /* ============================== *
   * merge: Any arrays at the top level of the list will have their elements
   * flattened into the top layer, allowing both contract and embedded
   * elements to be specified
   * ============================== */
  if (merge) {
    const mergedList = splitList
      .map((json) => json !== "" && JSON.parse(json))
      .reduce(
        (array, element) => [
          ...array,
          ...(Array.isArray(element) ? element : [element]),
        ],
        [],
      );

    return JSON.stringify(mergedList);
  }

  const joinedList = splitList.join(",");
  return `[${joinedList}]`;
};

export default list;
