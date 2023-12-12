/* eslint-disable @typescript-eslint/no-unused-vars */
import Contract from "../contract.js";
import MutationType from "../contract-types/base-contract.js";

export default function (bound: Injections, context) {
  const { type, key } = context.hash;

  const {
    executions: [executions],
    mutations,
  } = bound;

  if (key in mutations) {
    const previousMutation = mutations[key];

    if (
      previousMutation &&
      previousMutation instanceof MutationType &&
      previousMutation.mutated
    ) {
      const mutationRaw = JSON.stringify(previousMutation);
      executions.set(key, mutationRaw);
      return mutationRaw;
    }
  }

  if (executions.has(key)) {
    return executions.get(key);
  }

  const raw = context.fn(this);

  const contract = new Contract({ key, type, raw });
  const contractRaw = JSON.stringify(contract.execute(bound));

  executions.set(key, contractRaw);

  return contractRaw;
}
