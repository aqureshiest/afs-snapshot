/* eslint-disable @typescript-eslint/no-unused-vars */
import assert from "node:assert";
import { Status } from "../contract-types/base-contract.js";

const contractHelper: TemplateHelper = function (...args) {
  const key: string = typeof args[0] === "string" ? args[0] : args[0].hash.key;

  const options = args[args.length - 1];

  const { manifest, evaluations, contract: self } = options.data;

  /* ============================== *
   * If the referenced contract has not yet been executed, recursively execute
   * it and any dependencies before replacing it in the current render.
   * ============================== */

  const referencedContract =
    manifest.contracts[key as keyof typeof manifest.contracts];

  /* ============================== *
   * If there is no contract by the context key in the manifest, attempt to
   * grab an evaluation from the evaluations
   * ============================== */

  if (!referencedContract) {
    if (key in evaluations) {
      const evaluation = evaluations[key];
      return Array.isArray(evaluation)
        ? evaluation.map((e, i) => JSON.stringify(e.result))
        : JSON.stringify(evaluation.result);
    }
    return "";
  }

  /**
   */
  const deriveContractValue = (
    contract: Contract,
    index?: number,
  ): ContractType => {
    const evaluation =
      index != null ? evaluations[key]?.[index] : evaluations[key];

    if (evaluation) {
      self.dependencies[contract.id] = evaluation;
      evaluation.dependents[self.contract.id] = self;
      return evaluation;
    }

    const contractType = contract.execute(options.data, key, index);
    contractType.dependents[self.contract.id] = self;

    if (!(contract.id in self.dependents)) {
      self.dependencies[contract.id] = contractType;
    }

    return contractType;
  };

  const contractValue = Array.isArray(referencedContract)
    ? referencedContract.map((c, i) => deriveContractValue(c, i))
    : deriveContractValue(referencedContract);

  evaluations[key] = contractValue;

  const contractResult = Array.isArray(contractValue)
    ? contractValue.map((cv) => cv.result)
    : contractValue.result;

  if ("fn" in options) {
    return options.fn(contractResult || null);
  }

  return contractResult;
};

export default contractHelper;
