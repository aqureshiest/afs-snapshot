import { SideEffect } from "@earnest/state-machine";

/**
 * If any new mutations have been resolved, reexecute the manifest to replace
 * the mutation results in the contract
 */
export default new SideEffect({
  name: "execute",
  predicate(assertions: Assertions, prev: State, next: State) {
    if (prev.mutations && next.mutations) {
      const shouldReexecute = next.mutations.size > prev.mutations.size;
      return shouldReexecute;
    }

    const shouldReexecuteDefault =
      Boolean(next.mutations && !prev.mutations) || null;

    return shouldReexecuteDefault;
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
