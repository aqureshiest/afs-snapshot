export { default as list } from "./list.js";
export { default as contract } from "./contract.js";
export { default as ajv } from "./ajv.js";
export { default as schema } from "./schema.js";
export { default as obj } from "./obj.js";
export { default as spread } from "./spread.js";
export { default as maskValue } from "./maskValue.js";
export { default as getSchool } from "./getSchool.js";
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
  return String(new Date(v1).getMonth() + 1).padStart(2, "0");
}
export function day(v1) {
  return String(new Date(v1).getDate()).padStart(2, "0");
}
export function year(v1) {
  return new Date(v1).getFullYear();
}
/**
 * TODO: retirenment and unemployed income.type will be removed.
 * Determimne best way to save employment status type
 */
// export function employmentStatus(v1) {
//   const employed = ["employed", "self_employed", "future"];
//   if (employed.includes(v1)) {
//     return "employed";
//   } else {
//     return v1;
//   }
// }
export function dateObjToString(v1) {
  const month = String(v1.month).padStart(2, "0");
  const day = String(v1.day).padStart(2, "0");
  return `${v1.year}-${month}-${day}`;
}

export function formatDollarsToCents(v1) {
  const value = number(v1);
  let cents = (value + "").replace(/[^\d.-]/g, "");
  if (cents && cents.includes(".")) {
    cents = cents.substring(0, cents.indexOf(".") + 3);
  }
  return cents ? Math.round(parseFloat(cents) * 100) : 0;
}

export function formatCentsToDollars(v1) {
  const result = parseFloat((v1 + "").replace(/[^\d.-]/g, ""));
  return result ? result / 100 : 0;
}

export function formatToUSCurrency(v1) {
  if (v1) {
    return formatCentsToDollars(v1).toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
    });
  }
}

export function formatPhoneNumber(v1) {
  return `${v1.substring(0, 3)}-${v1.substring(3, 6)}-${v1.substring(6, 10)}`;
}

export function reviewDateFormatter(v1) {
  // Date from Application Service is formatted as yyyy-mm-dd
  const dateSplit = v1.split("-");

  // return date format as mm-dd-yyyy to UI
  return `${dateSplit[1]}/${dateSplit[2]}/${dateSplit[0]}`;
}

export function findCurrentAddress(addresses) {
  const currentAddress = addresses.find(
    (address) => address.type && address.type === "primary",
  );
  return currentAddress ? currentAddress : addresses[0];
}

export function formatAddress(address) {
  return `${address.street1} ${address.street2} ${address.city} ${address.state} ${address.zip}`;
}

export function findPreviousAddress(addresses) {
  return addresses.find(
    (address) => address.type && address.type === "previous",
  );
}

export function toUpper(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function getSchoolName(school) {
  return school?.name;
}
