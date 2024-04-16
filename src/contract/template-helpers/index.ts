export { default as list } from "./list.js";
export { default as contract } from "./contract.js";
export { default as ajv } from "./ajv.js";
export { default as schema } from "./schema.js";
export { default as obj } from "./obj.js";
export { default as spread } from "./spread.js";
export const noop = function (v1) {
  v1.fn(this);
  return "";
};
export const json = function (v1) {
  return JSON.stringify(v1 || null);
};
export const eq = (v1, v2) => v1 === v2;
export const ne = (v1, v2) => v1 !== v2;
export const lt = (v1, v2) => v1 < v2;
export const gt = (v1, v2) => v1 > v2;
export const lte = (v1, v2) => v1 <= v2;
export const gte = (v1, v2) => v1 >= v2;
export const not = (v1) => !v1;
export const notNull = (v1) => v1 !== null;
export const includes = (v1, v2) =>
  Array.isArray(v1) ? v1.includes(v2) : false;
export function and(...args) {
  return Array.prototype.every.call(args, Boolean);
}
export function or(...args) {
  return Array.prototype.slice.call(args, 0, -1).some(Boolean);
}
export function number(v1) {
  return Number(String(v1).replace(/[^0-9.]/g, ""));
}
export function month(v1) {
  return new Date(v1).getMonth() + 1;
}
export function day(v1) {
  return new Date(v1).getDate();
}
export function year(v1) {
  return new Date(v1).getFullYear();
}
export function employmentStatus(v1) {
  const employed = ["employed", "self_employed", "future"];
  if (employed.includes(v1)) {
    return "employed";
  } else {
    return v1;
  }
}
