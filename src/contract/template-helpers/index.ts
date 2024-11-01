import SensitiveString from "@earnest-labs/ts-sensitivestring";
import * as typings from "@earnest/application-service-client/typings/codegen.js";

export { default as list } from "./list.js";
export { default as contract } from "./contract.js";
export { default as ajv } from "./ajv.js";
export { default as schema } from "./schema.js";
export { default as obj } from "./obj.js";
export { default as spread } from "./spread.js";
export { default as maskValue } from "./maskValue.js";
export { default as getSchool } from "./getSchool.js";
export { default as mapLoanType } from "./mapLoanType.js";
export { mapProduct, getProductName } from "./mapProduct.js";
export { default as mapIncomeTypeToEmplStatus } from "./mapIncomeType.js";
export { default as findInArray } from "./array.js";
export { default as mapIncomeVerificationMethod } from "./mapIncomeVerificationMethod.js";
export { default as mapRatePayments } from "./mapRatePayments.js";
export { default as map } from "./map.js";
export { default as log } from "./log.js";
export { default as json } from "./json.js";
export {
  default as applicantById,
  getApplicantWithRole,
} from "./applicantById.js";
export { default as maybe } from "./maybe.js";

export function every(array: string[], condition: string, ...args: unknown[]) {
  if (array && Array.isArray(array)) {
    return array.every((item) => item === condition);
  }
}

export function some(array: string[], condition: string, ...args: unknown[]) {
  if (array && Array.isArray(array)) {
    return array.some((item) => item === condition);
  }
}

/**
 * Convert raw multi-line text into JSON-compatible string
 */
export const multiline = function (context) {
  const raw = Boolean(context.hash.raw);
  const text = context.fn(this, context);

  if (raw) {
    return JSON.stringify(text);
  } else {
    return JSON.stringify(JSON.parse(text)) + "\n";
  }
};

export const noop = function (v1) {
  if (typeof v1?.fn === "function") {
    v1.fn(this);
  }
  return "";
};

export const eq = (v1, v2) => v1 === v2;
export const ne = (v1, v2) => v1 !== v2;
export const lt = (v1, v2) => v1 < v2;
export const gt = (v1, v2) => v1 > v2;
export const lte = (v1, v2) => v1 <= v2;
export const gte = (v1, v2) => v1 >= v2;
export const not = (v1) => !v1;
export const notNull = (v1) => v1 !== null;

/**
 * As `Array.prototype.includes` except a weak comparison is made to each
 * element, and any additional arguments must also be satisfied
 */
export function includes(array: unknown[], ...args: unknown[]) {
  return Array.prototype.slice.call(args, 0, -1).every((arg) => {
    if (Array.isArray(array)) {
      for (const element of array || []) {
        if (arg == element) return true;
      }
    }

    return false;
  });
}

export function and(...args) {
  const operands = Array.prototype.slice.call(args, 0, -1);
  return Array.isArray(operands) && operands.length === 1
    ? operands[0].every(Boolean)
    : operands.every(Boolean);
}

export function or(...args) {
  const operands = Array.prototype.slice.call(args, 0, -1);
  return Array.isArray(operands) && operands.length === 1
    ? operands[0].some(Boolean)
    : operands.some(Boolean);
}

export function coalesce(...args) {
  const operands = Array.prototype.slice.call(args, 0, -1);
  return Array.isArray(operands) && operands.length === 1
    ? operands[0].find(Boolean)
    : operands.find(Boolean);
}

export function encodeURIStr(str) {
  return encodeURIComponent(str);
}

export function boolean(v1) {
  return Boolean(v1);
}

export function number(v1) {
  return Number(String(v1).replace(/[^0-9.]/g, ""));
}

export function string(v1) {
  return v1 != null ? String(v1) : "";
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

export function last8Years() {
  const currentYear = new Date().getFullYear();
  return Array.from({ length: 8 }, (_, i) => `"${currentYear - i}"`);
}

export function getCurrentTime() {
  return new Date().toISOString();
}

/**
 * Get the time delta between start time and now in milliseconds
 * @param start ISO String representation of a date
 * @returns time delta in milliseconds
 */
export function getTimeDelta(start) {
  return Date.now() - Date.parse(start);
}

/**
 * Check if we've reached the specified timeout
 * @param start ISO String representation of a date
 * @param timeout timeout in milliseconds
 * @returns Boolean
 */
export function reachedTimeout(start, timeout) {
  return getTimeDelta(start) > timeout;
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

export function formatToUSCurrency(...args) {
  const [v1, noDecimal] = Array.prototype.slice.call(args, 0, -1);
  return formatCentsToDollars(v1).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    ...(noDecimal ? { minimumFractionDigits: 0 } : {}),
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

export function sum(...args) {
  return Array.prototype.slice
    .call(args, 0, -1)
    .reduce((a, b) => a + (Number(b) || 0), 0);
}

export function multiply(...args) {
  return Array.prototype.slice
    .call(args, 0, -1)
    .reduce((a, b) => Number(a) * (Number(b) || 1), 1);
}

export function product(...args) {
  return Array.prototype.slice
    .call(args, 0, -1)
    .reduce((a, b) => a * (Number(b) || 0), 1);
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

/* v8 ignore next */
export function getSchoolInputValue(schoolArray) {
  const school = schoolArray?.[0];
  return school
    ? {
        opeid8: school?.opeid8,
        name: school?.name,
        address: school?.address,
        state: school?.state,
        city: school?.city,
        country: school?.country,
      }
    : "";
}

/* v8 ignore next */
export function schoolSupported(school, product) {
  const supported = school && school?.loanTypes?.includes(product)
  return supported
}

export function hasValues(value) {
  if (value) {
    return Object.values(value).some(
      (v) => v !== null && typeof v !== "undefined" && v !== "",
    );
  }
  return false;
}

export function stateMinLoan(addresses) {
  const minLoanCA = 1000000;
  const minLoanNM = 1000100;
  const minLoan = 500000;
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

export function stateFromAddress(addresses) {
  if (addresses) {
    const primaryAddress = findCurrentAddress(addresses);
    return primaryAddress?.state;
  }
  return null;
}

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
export function sumIncomeAmountRange(...args) {
  const [values, key, start, end] = args;
  let total = 0;
  if (values) {
    for (let i = start; i <= end; i += 1) {
      if (values[i] && values[i][key]) {
        total += values[i][key];
      }
    }
  }
  return total;
}

export function totalSum(...args) {
  const numsArray = Array.prototype.slice.call(args, 0, -1);
  return numsArray.reduce((acc, cur) => acc + cur);
}

export function testIsArray(v1) {
  return Array.isArray(v1);
}

export function getAdditionalIncomeSourceArray(v1, additionalIncome) {
  const entries = Object.entries(v1).filter(([_, v]) => v);
  const additionalIncomeArr: Array<{ type: string; amount: number }> = [];
  if (!(entries && additionalIncome)) {
    return undefined;
  }

  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    const obj = { type: entry[0], amount: 0 };
    if (i === 0) {
      obj.amount = Math.ceil(additionalIncome / entries.length);
    } else {
      obj.amount = Math.floor(additionalIncome / entries.length);
    }
    additionalIncomeArr.push(obj);
  }
  return additionalIncomeArr;
}
export function getAdditionalIncomeSourceTypes(v1) {
  return v1 ? v1.filter((i) => i.type).map((i) => i.type) : undefined;
}
export function checkAdditionalIncomeSourceExists(v1) {
  return v1
    ? v1
        .slice(1)
        .filter((i) => i.type)
        .map((i) => i.type)
    : undefined;
}

export function getAdditionalIncomeSourceTypesAsString(v1) {
  const mapping_arr = {
    rental: "Rental income",
    k1: "K-1 income",
    social_security_or_pension: "Social security / Pension",
    child_support_or_alimony: "Child support / alimony",
    disability: "Disability",
  };
  return v1
    .slice(1)
    .filter((i) => i.type)
    .map((i) => i.type)
    .reduce((a, i) => `${a}\n${mapping_arr[`${i}`]}`, "");
}

/**
 * Test if at least one financial account is selected
 */
export function someSelected(financialAccounts) {
  return financialAccounts.some((account) => account.selected === true);
}

/**
 * Get all selected financial accounts
 */
export function selectedAccounts(financialAccounts) {
  return financialAccounts.filter((account) => account.selected === true);
}

export function match(input: string, pattern: string, maybeFlags?: string) {
  if (!input) return null;
  const flags = typeof maybeFlags === "string" ? maybeFlags : undefined;
  const re = new RegExp(pattern, flags);
  return input.match(re);
}

export function atob(input: string) {
  if (!input) return null;
  return Buffer.from(input, "base64").toString("utf8");
}

export function btoa(input: string) {
  if (!input) return null;
  return Buffer.from(input, "utf8").toString("base64");
}

export function extractSensitiveString(sensitiveString: SensitiveString) {
  return SensitiveString.ExtractValue(sensitiveString);
}

export function getFinancialAccountsAsString(financialAccounts) {
  const selectedFinancialAccounts = selectedAccounts(financialAccounts);
  return selectedFinancialAccounts.reduce(
    (a, i) => `${a}\n${i.name} - ${i.account_last4}`,
    "",
  );
}

export function searchDeniedArtifactTags(tags) {
  const deniedTags = [
    "RC_OfferCosigner",
    "RC_Primary_Decline",
    "RC_Cosigner_Decline",
  ];
  return deniedTags.some((v) => tags.includes(v));
}

export function hasActiveIncompleteApplication(
  id: string,
  applications: typings.Application[],
) {
  if (!id || (Array.isArray(applications) && !applications.length)) {
    return null;
  }

  return Object.values(applications)
    .filter(
      (app) =>
        app?.tag?.active && app.id !== id && app.tag.status === "incomplete",
    )
    .pop();
}

export function hasActivePostSubmissionApplication(
  id: string,
  applications: typings.Application[],
) {
  if (Array.isArray(applications) && !applications.length) {
    return null;
  }

  return Object.values(applications)
    .filter(
      (app) =>
        app?.tag?.active && app.id !== id && app.tag.status !== "incomplete",
    )
    .pop();
}

export function ISODateToYYYYMMDD(dateStr: string) {
  if (dateStr) {
    return new Date(dateStr).toISOString().split("T")[0];
  }
}

export function getApplicant(id: string, application: typings.Application) {
  return (application.applicants || []).find(
    (applicant) => applicant && applicant?.id === id,
  );
}

export function mapCitizenship(citizenship: string): string | null {
  const citizenshipMapping = Object.freeze({
    citizen: "U.S. Citizen",
    permanent_resident: "U.S. Permanent Resident",
    asylee: "Asylee",
    daca: "Deferred Action Childhood Arrivals",
    h1_b: "H1-B",
    "non-resident": "Non-U.S. Resident/Other",
  });

  return citizenshipMapping[citizenship] || null;
}

export function keyString(key: string): string | null {
  const TOKEN_LENGTH = 8;
  let result = "";
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < TOKEN_LENGTH; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return `"${key}-${result}"`;
}

export function getApplicantByEmail(
  email: string,
  application: typings.Application,
) {
  return (application.applicants || []).find(
    (applicant) =>
      applicant && applicant?.details && applicant.details.email === email,
  );
}

export function getApplicantByUserID(
  userId: string,
  application: typings.Application,
) {
  return (application.applicants || []).find(
    (applicant) =>
      applicant &&
      applicant?.reference &&
      (applicant.reference.userID === userId ||
        applicant.reference.userIdBeforeVerifyingThroughEmailId === userId),
  );
}

export function mapProductForRedirect(product: string): string {
  const productMapping = Object.freeze({
    "student-refi": "student-refi",
    slr: "student-loan-refi",
  });

  return productMapping[product];
}

export function escapeUrlParam(input: string) {
  if (!input) return null;
  return encodeURIComponent(input);
}

export function getMostRecentRateInquiry(decisions) {
  if (!Array.isArray(decisions) || decisions.length === 0) {
    return null;
  }

  return decisions.reduce((mostRecent, current) => {
    return current.type === "rate-check" &&
      new Date(current.inquiryDate) > new Date(mostRecent.inquiryDate)
      ? current
      : mostRecent;
  });
}
