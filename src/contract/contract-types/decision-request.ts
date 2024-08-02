import assert from "node:assert";
import ContractExecutable from "../contract-executable.js";

class DecisionRequest extends ContractExecutable<
  Definition,
  Definition,
  Output
> {
  get executionName(): string {
    return "DecisionRequest";
  }

  condition = (_, __, ___, definition: Definition) => {
    return Boolean(definition.id);
  };

  evaluate = async (
    context: Context,
    executionContext,
    input: Input,
    definition: Definition,
  ) => {
    const lendingDecisionService =
      context.loadedPlugins.lendingDecisionServiceClient?.instance;
    assert(
      lendingDecisionService,
      "[02f312ed] Lending Decision Service client not instantiated",
    );
    let result;
    try {
      result = await lendingDecisionService[definition.decisionRequestMethod](
        input,
        context,
        definition.id,
        definition.payload,
      );
    } catch (ex) {
      const error = new Error("[3b1f3cf5] Failed to execute decision request");

      this.log(context, {
        message: error.message,
        error: ex,
        method: definition && definition.decisionRequestMethod,
      });

      this.error(executionContext, error);
    }

    return result;
  };
}

export default DecisionRequest;
