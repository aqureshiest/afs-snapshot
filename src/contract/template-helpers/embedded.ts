/* eslint-disable @typescript-eslint/no-unused-vars */
import Contract from "../contract.js";
import ContractType from "../contract-types/base-contract.js";

const embedded: TemplateHelper = function (context) {
  const { type, key } = context.hash;

  const { evaluations, dependents } = this;

  if (key in evaluations) {
    const evaluation = evaluations[key];

    if (evaluation) {
      return JSON.stringify(evaluation);
    }
  }

  const raw = context.fn(this);

  const contract = new Contract({ key, type, raw }).execute(this, key);

  dependents[key] = contract;
  evaluations[key] = contract;

  const contractRaw = JSON.stringify(contract) || "null";

  return contractRaw;
};

export default embedded;
