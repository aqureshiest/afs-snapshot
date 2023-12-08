/* eslint-disable @typescript-eslint/no-unused-vars */
import embedded from "./embedded.js";

const contract = (bound: Injections) =>
  function (context) {
    if (typeof context !== "string") {
      return embedded(bound, context);
    }

    const {
      context: chassisContext,
      manifest,
      executions: [executions, newExecutions],
    } = bound;

    /* ============================== *
     * If the referenced contract has not yet been executed, recursively execute
     * it and any dependencies before replacing it in the current render.
     * ============================== */

    if (!executions.has(context)) {
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

      const injections = {
        ...bound,
        executions: [new Map([...executions, ...newExecutions])],
      };

      const contractValue = Array.isArray(referencedContract)
        ? referencedContract.map((parallelContract) =>
            parallelContract.execute(injections),
          )
        : referencedContract.execute(injections);

      const contractRaw = JSON.stringify(contractValue);

      newExecutions.set(context, contractRaw);
      return contractRaw;
    }

    return executions.get(context);
  };

export default contract;
