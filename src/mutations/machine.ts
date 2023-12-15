import { SideEffectMachine } from "@earnest/state-machine";
import { Status } from "../contract/contract-types/base-contract.js";

import effects from "./effects/index.js";

const TIME_LIMIT_MS = 1000 * 15;

/**
 * Detect if mutations in assertions have completed by comparing it to the recorded
 * mutation completions in state
 */
function mutationCompleted(assertions: Assertions, state: State): boolean {
  for (const mutationKey in assertions.mutations) {
    const mutation = assertions.mutations[mutationKey];
    if ([Status.Pending, Status.Executing].includes(mutation.status))
      return true;
    if (mutation.status === Status.Done && !state.mutations.has(mutationKey))
      return true;
  }

  // The machine halts if all mutations are either Dormant or Done and recorded

  return false;
}

function exceededTimeLimit(assertions: Assertions): boolean {
  const { asOf: start } = assertions;
  const now = Date.now();
  return now - start.getTime() > TIME_LIMIT_MS;
}

/**
 * Create a set of all completed mutations and record it in state
 */
function recordMutations(assertions: Assertions): State {
  const mutatedMutationKeys = Object.keys(assertions.mutations).filter(
    (mutationKey) => assertions.mutations[mutationKey].status === Status.Done,
  );
  const mutations = new Set(mutatedMutationKeys);
  return { mutations };
}

function timeLimitException(): never {
  throw new Error("Mutations failed to resolve within the time limit");
}

export default new SideEffectMachine<State, Assertions>(
  recordMutations,
  (tree, signals) =>
    tree
      .fork(timeLimitException, exceededTimeLimit)
      .fork(recordMutations, mutationCompleted)
      .fork(signals.HALT),
  effects,
);
