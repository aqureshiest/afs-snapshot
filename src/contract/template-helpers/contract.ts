/* eslint-disable @typescript-eslint/no-unused-vars */
import assert from "node:assert";
import embedded from "./embedded.js";
import { Status } from "../contract-types/base-contract.js";

const contract: TemplateHelper = function (context, ...args) {
  if (typeof context !== "string") {
    /* ============================== *
     * Block Contracts
     * ------------------------------ *
     * If the 'contract' helper is invoked as a block helper, instead of
     * with a single reference argument, it will interpret the contents
     * of the block as an inline definition for a contract, apply any rules
     * for the provided 'type' hash, and assign it the provided 'key' hash
     * ============================== */
    return embedded.call(this, context, ...args);
  }

  const options = args[args.length - 1];

  assert(typeof options !== "string", "[40685178] Invalid template options");

  const path = args.filter((arg) => typeof arg === "string") as string[];

  const { manifest, evaluations, dependents } = options.data;

  /* ============================== *
   * If the referenced contract has not yet been executed, recursively execute
   * it and any dependencies before replacing it in the current render.
   * ============================== */

  const referencedContract =
    manifest.contracts[context as keyof typeof manifest.contracts];

  /* ============================== *
   * If there is no contract by the context key in the manifest, attempt to
   * grab an evaluation from the evaluations
   * ============================== */

  if (!referencedContract) {
    if (context in evaluations) {
      const evaluation = evaluations[context];
      return Array.isArray(evaluation)
        ? evaluation.map((e, i) => JSON.stringify(e.get(String(i), ...path)))
        : JSON.stringify(evaluation.get(...path));
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
      index != null ? evaluations[context]?.[index] : evaluations[context];

    if (evaluation) {
      dependents[contract.id] = evaluation;
      return evaluation;
    }

    const contractType = contract.execute(options.data, context, index);

    if (!(contract.id in dependents)) {
      dependents[contract.id] = contractType;
    }

    return contractType;
  };

  const contractValue = Array.isArray(referencedContract)
    ? referencedContract.map((c, i) => deriveContractValue(c, i))
    : deriveContractValue(referencedContract);

  evaluations[context] = contractValue;

  const contractRaw =
    JSON.stringify(
      Array.isArray(contractValue) ? contractValue : contractValue.get(...path),
    ) || "null";

  return contractRaw;
};

export default contract;
