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

  condition = (context, __, definition: Definition) => {
    context.logger.info({
      message: "===== OptimizelyMethod condition  ",
      definition
    });
    return Boolean(definition && definition.userId);
  };

  evaluate = async (context: Context, input: Input, definition: Definition) => {
    const optimizelyClient = context.loadedPlugins.optimizelyClient?.instance;
    assert(optimizelyClient, "[f4cf8448] Optimizely Client not instantiated");
    context.logger.info({
      message: "===== OptimizelyMethod evaluate",
      definition
    });
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
    console.log('========= optimizely result', result)
    return result;
  };
}

export default OptimizelyMethod;
