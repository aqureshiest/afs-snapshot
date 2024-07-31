import assert from "node:assert";
import * as contractTypes from "./contract-types/index.js";
import { createHash } from "crypto";

import * as constants from "./constants.js";
import handlebars from "./handlebars.js";

export default class Contract<I> implements ExecutableParent<Input<I>> {
  id: string;
  name: string;
  version: string;
  Constructor: (typeof contractTypes)[ContractType];
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
    this.Constructor =
      contractTypes[type as ContractType] || contractTypes.identity;
    this.raw = raw;
    this.template = handlebars.compile(raw);
  }

  /**
   * @param {Function} reviver - contract execution reviver that has the
   * full manifest bound as a parameter to allow full referencing
   */
  input(context, executionContext: ExecutionContext<I>, input) {
    const { index, key, manifest } = executionContext;
    const evaluations = (executionContext.evaluations =
      executionContext.evaluations || {});

    const id =
      (manifest ? manifest.id : "") +
      (key != null ? ":" + key : "") +
      (index != null ? `[${index}]` : "");

    const contractInstance = new this.Constructor({
      parent: this,
      id,
      index,
      evaluations,
    }).input(context, executionContext, input);

    /* ============================== *
     * Each unique mutation will be recorded in the mutations object. If a
     * contract needs to be re-executed after mutations, previously run
     * mutations will be used preferentially;
     * ============================== */
    const evaluationKey = key || constants.ROOT_CONTRACT;

    const existingContract =
      index != null
        ? evaluations[evaluationKey]?.[index]
        : evaluations[evaluationKey];

    if (existingContract && existingContract.isLocked) {
      return existingContract;
    }

    return contractInstance;
  }

  async execute(pluginContext, executionContext, input) {
    const executable = this.input(pluginContext, executionContext, input);
    await executable.execute(pluginContext, executionContext, input);
    return executable;
  }
}
