export { default as list } from "./list.js";
export { default as contract } from "./contract.js";
export { default as ajv } from "./ajv.js";
export { default as schema } from "./schema.js";
export { default as obj } from "./obj.js";
export { default as spread } from "./spread.js";
export { default as maskValue } from "./maskValue.js";
export { default as getSchool } from "./getSchool.js";
export { default as mapLoanType } from "./mapLoanType.js";
export { default as mapProduct } from "./mapProduct.js";
export { default as mapIncomeTypeToEmplStatus } from "./mapIncomeType.js";
export { default as findInArray } from "./array.js";

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

export function boolean(v1) {
  return Boolean(v1);
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
 * Determine best way to save employment status type
 */
export function mapEmploymentStatusType(v1) {
  const employed = ["employed", "self_employed", "future"];
  if (employed.includes(v1)) {
    return "employment";
  }
  if (v1 === "unemployed") {
    return "unspecified";
  }
  return "";
}

export function dateObjToString(v1) {
  if (v1) {
    const month = String(v1.month).padStart(2, "0");
    const day = String(v1.day).padStart(2, "0");
    return `${v1.year}-${month}-${day}`;
  }
}

export function formatDollarsToCents(v1) {
  if (v1) {
    const value = number(v1);
    let cents = (value + "").replace(/[^\d.-]/g, "");
    if (cents && cents.includes(".")) {
      cents = cents.substring(0, cents.indexOf(".") + 3);
    }
    return cents ? Math.round(parseFloat(cents) * 100) : 0;
  }
}

export function formatCentsToDollars(v1) {
  const result = parseFloat((v1 + "").replace(/[^\d.-]/g, ""));
  return result ? result / 100 : 0;
}

export function formatToUSCurrency(v1) {
  return formatCentsToDollars(v1).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  });
}

export function formatPhoneNumber(v1) {
  if (v1) {
    return `${v1.substring(0, 3)}-${v1.substring(3, 6)}-${v1.substring(6, 10)}`;
  }
}

export function reviewDateFormatter(v1) {
  if (v1) {
    // Date from Application Service is formatted as yyyy-mm-dd
    const dateSplit = v1.split("-");

    // return date format as mm-dd-yyyy to UI
    return `${dateSplit[1]}/${dateSplit[2]}/${dateSplit[0]}`;
  }
}

export function findCurrentAddress(addresses) {
  const currentAddress = addresses.find(
    (address) => address.type && address.type === "primary",
  );
  return currentAddress ? currentAddress : addresses[0];
}

export function formatAddress(address) {
  if (address) {
    return address.street2
      ? `${address.street1}, ${address.street2}, ${address.city}, ${address.state} ${address.zip}`
      : `${address.street1}, ${address.city}, ${address.state} ${address.zip}`;
  }
}

export function findPreviousAddress(addresses) {
  return addresses.find(
    (address) => address.type && address.type === "previous",
  );
}

//add a function that adds the 2 string parameters that it receives, if a parameter is invalid make 0 the default value
export function mathAdd(v1, v2) {
  const num1 = Number(v1) || 0;
  const num2 = Number(v2) || 0;
  return num1 + num2;
}

export function toUpper(value) {
  if (value) {
    return value.charAt(0).toUpperCase() + value.slice(1);
  }
}

export function toNeutralize(value) {
  if (value) {
    return value.replace(/_/g, " ");
  }
}

export function toNeutralizeAndUpper(value) {
  if (value) {
    return toNeutralize(toUpper(value));
  }
}

export function getSchoolName(school) {
  return school?.name;
}

export function hasValues(value) {
  if (value) {
    return Object.values(value).some(
      (v) => v !== null && typeof v !== "undefined",
    );
  }
  return false;
}

export function stateMinLoan(addresses) {
  const minLoanCA = "$10,000";
  const minLoanNM = "$10,001";
  const minLoan = "$5,000";
  if (addresses) {
    const primaryAddress = findCurrentAddress(addresses);
    switch (primaryAddress.state) {
      case "CA":
        return minLoanCA;
      case "NM":
        return minLoanNM;
    }
  }
  return minLoan;
}

export function sumIncomeAmountRange(...args) {
  const [values, key, start, end] = args;
  /**
   * 'values' can be an income detail from db with structure:
   *    {
   *       "amount": number,
   *       "type": string,
   *       "employer": string,
   *       "name": string,
   *       "title": string,
   *       "start": date,
   *       "end": date
   *    }
   * or an additionalIncomeSource type from UI with structure:
   *    {
   *       "type": string
   *       "value": number
   *    }
   * use 'key' to access either 'amount' or 'value' depending on
   * input value type
   */
  let sum = 0;
  if (values) {
    for (let i = start; i <= end; i += 1) {
      if (values[i] && values[i][key]) {
        sum += values[i][key];
      }
    }
  }
  return sum;
}

export function totalSum(...args) {
  const numsArray = Array.prototype.slice.call(args, 0, -1);
  return numsArray.reduce((acc, cur) => acc + cur);
}
