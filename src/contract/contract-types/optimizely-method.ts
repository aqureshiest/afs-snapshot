import assert from "node:assert";
import ContractExecutable from "../contract-executable.js";

class OptimizelyMethod extends ContractExecutable<
  Definition,
  Definition,
  Output
> {
  get executionName(): string {
    return "OptimizelyMethod";
  }

  condition = (_, __, definition: Definition) => {
    return Boolean(definition && definition.userId);
  };

  evaluate = async (context: Context, input: Input, definition: Definition) => {
    const optimizelyClient = context.loadedPlugins.optimizelyClient?.instance;
    assert(optimizelyClient, "[f4cf8448] Optimizely Client not instantiated");

    let result;
    try {
      result = await optimizelyClient[definition.optimizelyMethod](
        definition.featureFlagKeys,
        definition.userId,
      );
    } catch (ex) {
      const error = new Error("[63a5493f] Failed to get optimizely data");
      this.log(context, {
        message: error.message,
        method: definition && definition.optimizelyMethod,
        error: ex,
      });

      this.error(error);
    }
    return result;
  };
}

export default OptimizelyMethod;
