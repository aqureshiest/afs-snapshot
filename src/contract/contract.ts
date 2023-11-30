import * as constants from "./constants.js";
import * as contractTypes from "./contract-types/index.js";

export default class Contract {
  type: (typeof contractTypes)[ContractType];
  raw: string;
  parsed: unknown;

  /**
   * parse important features of a contract
   */
  static parseContract(rawContract: string) {
    const substitutions: string[] = [];
    JSON.parse(rawContract, (key: string, rawValue: ContractSubstitution) => {
      if (rawValue != null && typeof rawValue === "object") {
        if (constants.REFERENCE_SUBSTITUTION_SYMBOL in rawValue) {
          const substitutionKey =
            rawValue[constants.REFERENCE_SUBSTITUTION_SYMBOL];

          substitutions.push(substitutionKey);
        }
      }
      return rawValue;
    });

    return { substitutions };
  }

  constructor(type: string, rawContract: string) {
    this.type = contractTypes[type as ContractType] || contractTypes.identity;
    this.raw = rawContract;
    this.parsed = Contract.parseContract(rawContract);
  }

  /**
   * @param {Function} reviver - contract execution reviver that has the
   * full manifest bound as a parameter to allow full referencing
   */
  execute(
    reviver: Parameters<typeof JSON.parse>[1],
    input?: Input,
    coercion?: string,
  ) {
    const subParsed = JSON.parse(this.raw, reviver);

    /* ============================== *
     * If no input is provided, return the parsed contract, which contains
     * meta-details about the expected inputs
     * ============================== */

    if (!input) {
      return subParsed;
    }

    /* ============================== *
     * If inputs are provided, execute the contract according to its type
     * ============================== */

    const contractInstance = new this.type(subParsed, input);

    if (coercion) {
      contractInstance.coerce(coercion);
    }

    return contractInstance instanceof contractTypes.MutationType
      ? contractInstance
      : contractInstance.toJSON();
  }
}
