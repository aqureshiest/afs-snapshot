import assert from "node:assert";
import ContractExecutable from "../contract-executable.js";

class AccreditedSchoolServiceRequest extends ContractExecutable<
  Definition,
  Definition,
  Output
> {
  get executionName(): string {
    return "AccreditedSchoolServiceRequest";
  }

  condition = (_, __, ___, definition: Definition) => {
    /**
     * TODO: Add authentication checks
     */
    return Boolean(definition.accreditedSchoolServiceRequestMethod);
  };

  evaluate = async (
    context: Context,
    executionContext,
    input: Input,
    definition,
  ) => {
    const accreditedSchoolServiceClient =
      context.loadedPlugins.accreditedSchoolService.instance;
    assert(
      accreditedSchoolServiceClient,
      "[2aef0653] Accredited School Service client not instantiated",
    );

    try {
      const result = await accreditedSchoolServiceClient[
        definition.accreditedSchoolServiceRequestMethod
      ](input, context, definition);
      return result;
    } catch (ex) {
      const error = new Error("[6dd53da4] Failed to get school data");
      this.log(context, {
        message: error.message,
        method: definition && definition.accreditedSchoolServiceRequestMethod,
        error: ex,
      });

      this.error(executionContext, error);
      return [];
    }
  };
}

export default AccreditedSchoolServiceRequest;
