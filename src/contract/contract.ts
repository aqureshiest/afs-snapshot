import * as contractTypes from "./contract-types/index.js";
import * as templateHelpers from "./template-helpers/index.js";

const { Status } = contractTypes.MutationType;

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
    this.id = version ? `${key}.${version}` : key || this.raw;
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

    if (
      previousMutation &&
      [Status.Executing, Status.Done].includes(previousMutation.status)
    ) {
      return previousMutation;
    }

    const options = {
      helpers: {
        list: templateHelpers.list(contractInjections),
        contract: templateHelpers.contract(contractInjections),
        json: templateHelpers.json,
        eq: templateHelpers.eq,
        ne: templateHelpers.ne,
        lt: templateHelpers.lt,
        gt: templateHelpers.gt,
        gte: templateHelpers.gte,
        lte: templateHelpers.lte,
        and: templateHelpers.and,
        or: templateHelpers.or,
        not: templateHelpers.not,
      },
    };

    const { input } = contractInjections;

    const raw = this.template(input, options) as unknown;

    const contractInstance = new this.type({
      id: this.id,
      definition: raw,
      input,
      context: injections.context,
    });

    /* ============================== *
     * Each unique mutation will be recorded in the mutations object. If a
     * contract needs to be re-executed after mutations, previously run
     * mutations will be used preferentially
     * ============================== */

    if (contractInstance instanceof contractTypes.MutationType) {
      const existingMutation = mutations[contractInstance.id];

      mutations[contractInstance.id] =
        existingMutation &&
        [Status.Executing, Status.Done].includes(existingMutation.status)
          ? mutations[contractInstance.id]
          : contractInstance;

      return contractInstance;
    }

    return contractInstance;
  }
}
