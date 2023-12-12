export { default as list } from "./list.js";
export { default as contract } from "./contract.js";

export const json = (v1) => JSON.stringify(v1);
export const eq = (v1, v2) => v1 === v2;
export const ne = (v1, v2) => v1 !== v2;
export const lt = (v1, v2) => v1 < v2;
export const gt = (v1, v2) => v1 > v2;
export const lte = (v1, v2) => v1 <= v2;
export const gte = (v1, v2) => v1 >= v2;
export const not = (v1) => !v1;
export function and(...args) {
  return Array.prototype.every.call(args, Boolean);
}
export function or(...args) {
  return Array.prototype.slice.call(args, 0, -1).some(Boolean);
}
