import * as contractTypes from "./contract-types/index.js";
import * as templateHelpers from "./template-helpers/index.js";

import { createJsonHandlebars } from "handlebars-a-la-json";
const handlebars = createJsonHandlebars();

export default class Contract {
  id: string;
  name: string;
  version: string;
  type: (typeof contractTypes)[ContractType];
  raw: string;
  parsed: unknown;
  template: Template;

  constructor({ key, version, type, raw }: ContstructorArguments) {
    this.id = key && version ? `${key}.${version}` : this.raw;
    this.type = contractTypes[type as ContractType] || contractTypes.identity;
    this.raw = raw;
    this.template = handlebars.compile(raw);
  }

  /**
   * @param {Function} reviver - contract execution reviver that has the
   * full manifest bound as a parameter to allow full referencing
   */
  execute(injections: Injections) {
    const contractInjections = {
      ...injections,
      executions: [...injections.executions, new Map()],
    };

    const { mutations } = injections;

    /* ============================== *
     * If this this is a re-execution after mutations have been run, prefer
     * any already completed mutations
     * ============================== */

    const previousMutation = mutations[this.id];

    if (previousMutation && previousMutation.mutated) {
      return previousMutation;
    }

    const options = {
      helpers: {
        list: templateHelpers.list(contractInjections),
        contract: templateHelpers.contract(contractInjections),
      },
    };

    const { input } = contractInjections;

    const raw = this.template(input, options);

    const contractInstance = new this.type(this.id, raw);

    return contractInstance instanceof contractTypes.MutationType
      ? contractInstance
      : contractInstance.toJSON();
  }
}
