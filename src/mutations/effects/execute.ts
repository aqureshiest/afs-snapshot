import { SideEffect } from "@earnest/state-machine";

/**
 * Whenever a side-effect replaces the input, assertions
 */
export default new SideEffect({
  name: "execute",
  predicate(assertions: Assertions, prev: State, next: State) {
    if (prev.asOf && next.asOf) {
      return next.asOf.getTime() > prev.asOf.getTime() || null;
    }

    return Boolean(next.asOf && !prev.asOf) || null;
  },
  async effect() {
    return (assertions) => {
      const { context, manifest, input, mutations } = assertions;
      const { contract, mutations: newMutations } = manifest.execute(
        context,
        input,
        mutations,
      );

      return {
        ...assertions,
        mutations: newMutations,
        contract,
      };
    };
  },
});
