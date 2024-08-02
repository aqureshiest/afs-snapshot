import assert from "node:assert";
import ContractExecutable from "../contract-executable.js";

class PiiRequest extends ContractExecutable<Definition, Definition, Output> {
  get executionName(): string {
    return "PiiRequest";
  }

  condition = (_, __, ___, definition: Definition) => {
    /**
     * TODO: Add authentication checks
     */

    return Boolean(definition && definition.id);
  };

  evaluate = async (
    context: Context,
    executionContext,
    input: Input,
    definition: Definition,
  ) => {
    const piiTokenService =
      context.loadedPlugins.piiTokenServiceClient?.instance;
    assert(
      piiTokenService,
      "[0168364b] PII Token Service client not instantiated",
    );

    let result;
    try {
      result = await piiTokenService[definition.piiRequestMethod](
        context,
        definition.value,
      );
    } catch (ex) {
      const error = new Error("Failed to get school data");
      this.log(context, {
        message: error.message,
        method: definition && definition.piiRequestMethod,
        error: ex,
      });

      this.error(executionContext, error);
    }

    return result;
  };
}

export default PiiRequest;
