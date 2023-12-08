import * as contractTypes from "./contract-types/index.js";
import * as templateHelpers from "./template-helpers/index.js";

import { createJsonHandlebars } from "handlebars-a-la-json";
const handlebars = createJsonHandlebars();

export default class Contract {
  type: (typeof contractTypes)[ContractType];
  raw: string;
  parsed: unknown;
  template: Template;

  constructor(type: string, rawContract: string) {
    this.type = contractTypes[type as ContractType] || contractTypes.identity;
    this.raw = rawContract;
    this.template = handlebars.compile(rawContract);
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

    const options = {
      helpers: {
        list: templateHelpers.list(contractInjections),
        contract: templateHelpers.contract(contractInjections),
      },
    };

    const { input } = contractInjections;

    const raw = this.template(input, options);

    const contractInstance = new this.type(raw, input);

    return contractInstance instanceof contractTypes.MutationType
      ? contractInstance
      : contractInstance.toJSON();
  }
}
