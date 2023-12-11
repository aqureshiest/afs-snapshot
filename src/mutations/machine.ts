import { SideEffectMachine } from "@earnest/state-machine";

import effects from "./effects/index.js";

/**
 * Assertions are refreshed every evaluation. State contains the previous set of assertions. If the timestamp has advanced, we return true, to indicate that this is a new run.
 * @return {boolean} returns true if the assertions have changed
 */
function assertionsChanged(assertions: Assertions, state: State): boolean {
  if (assertions.asOf && state.asOf) {
    return assertions.asOf.getTime() > state.asOf.getTime();
  }

  return Boolean(assertions.asOf && !state.asOf);
}

/**
 * Update current evaluation's State with the newly provided Assertions, which are unique to this run.
 * @return {State} state with new assertions mapped to it
 */
function copyAssertionsToState(assertions: Assertions): State {
  return { asOf: assertions.asOf };
}

export default new SideEffectMachine<State, Assertions>(
  // Initializing the State given a new run's Assertions.
  copyAssertionsToState,
  // TreeBuilder.
  (tree, signals) =>
    tree
      .fork(copyAssertionsToState, assertionsChanged)
      // If the above condition returns false, then HALT.
      .fork(signals.HALT),
  effects,
);
