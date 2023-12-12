/* eslint-disable @typescript-eslint/no-unused-vars */
import embedded from "./embedded.js";

const contract = (bound: Injections) =>
  function (context) {
    if (typeof context !== "string") {
      return embedded.call(this, bound, context);
    }

    const {
      context: chassisContext,
      manifest,
      executions: [executions, newExecutions],
      mutations,
    } = bound;

    if (executions.has(context)) {
      return executions.get(context);
    }

    /* ============================== *
     * If the referenced contract has not yet been executed, recursively execute
     * it and any dependencies before replacing it in the current render.
     * ============================== */

    const referencedContract =
      manifest.contracts[context as keyof typeof manifest.contracts];

    if (!referencedContract) {
      const error = new Error("Invalid contract reference");
      chassisContext.logger.error({
        message: error.message,
        reference: context,
        contract: this,
      });

      throw error;
    }

    const deriveContractValue = (contract) => {
      if (contract.id in mutations) {
        return mutations[contract.id];
      }
      return contract.execute(injections);
    };

    const injections = {
      ...bound,
      executions: [new Map([...executions, ...newExecutions])],
    };

    const contractValue = Array.isArray(referencedContract)
      ? referencedContract.map(deriveContractValue)
      : deriveContractValue(referencedContract);

    const contractRaw = JSON.stringify(contractValue);

    newExecutions.set(context, contractRaw);
    return contractRaw;
  };

export default contract;
