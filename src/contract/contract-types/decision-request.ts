import assert from "node:assert";
import ContractType from "./base-contract.js";

class DecisionRequest extends ContractType<Definition, Definition, Output> {
  get contractName(): string {
    return "DecisionRequest";
  }

  condition = (input: Input, context: Injections, definition: Definition) => {
    /**
     * TODO: Add authentication checks
     */

    return Boolean(definition.id);
  };

  evaluate = async (
    input: Input,
    injections: Injections,
    definition: Definition,
  ) => {
    const { context } = injections;
    const lendingDecisionService =
      context.loadedPlugins.lendingDecisionServiceClient?.instance;
    assert(
      lendingDecisionService,
      "[02f312ed] Lending Decision Service client not instantiated",
    );
    let result;
    try {
      result = await lendingDecisionService[definition.decisionRequestMethod](
        context,
        definition.id,
        definition.payload,
      );
    } catch (ex) {
      this.error(
        input,
        `[d0aae09c] failed ${this.contractName}:\n${ex.message}`,
      );
      context.logger.info({
        messege: "[e87ed412] Lending Decision Contract Failed",
        ...ex,
      });
      context.logger.error(ex);
    }

    return result;
  };
}

export default DecisionRequest;
