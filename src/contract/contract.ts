import * as contractTypes from "./contract-types/index.js";
import { createHash } from "crypto";

import handlebars from "./handlebars.js";

export default class Contract {
  id: string;
  name: string;
  version: string;
  type: (typeof contractTypes)[ContractType];
  raw: string;
  parsed: unknown;
  template: Template;

  constructor({
    version,
    folders,
    type,
    raw,
    key = createHash("sha1").update(raw).digest().toString("hex"),
  }: ContstructorArguments) {
    const contractKey =
      folders && folders.length > 0 ? `${folders.join("/")}/${key}` : key;

    this.name = contractKey;
    this.id = version ? `${contractKey}.${version}` : contractKey;
    this.version = version ? version : "default";
    this.type = contractTypes[type as ContractType] || contractTypes.identity;
    this.raw = raw;
    this.template = handlebars.compile(raw);
  }

  /**
   * @param {Function} reviver - contract execution reviver that has the
   * full manifest bound as a parameter to allow full referencing
   */
  execute(
    injections: Omit<Injections, "dependents">,
    key: string,
    index?: number,
  ) {
    const { evaluations } = injections;

    const contractInstance = new this.type({
      contract: this,
      id: this.id,
    });

    /* ============================== *
     * Each unique mutation will be recorded in the mutations object. If a
     * contract needs to be re-executed after mutations, previously run
     * mutations will be used preferentially;
     * ============================== */

    const existingContract =
      index != null ? evaluations[key]?.[index] : evaluations[key];

    if (existingContract && existingContract.isLocked) {
      return existingContract;
    }

    return contractInstance;
  }
}
