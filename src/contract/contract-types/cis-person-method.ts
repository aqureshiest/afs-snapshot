import assert from "node:assert";
import ContractExecutable from "../contract-executable.js";

class CisPersonMethod extends ContractExecutable<Definition, Definition, Output> {
  get executionName(): string {
    return "CisPersonMethod";
  }

  condition = (_, __, definition: Definition) => {
    return Boolean(definition && definition.id);
  };

  evaluate = async (
    context: Context,
    input: Input,
    definition: Definition,
  ) => {
    const cisPersonClient =
      context.loadedPlugins.cisPersonClient?.instance;
    assert(
      cisPersonClient,
      "[fd5f985f] CIS Person Client not instantiated",
    );

    let result;
    try {
      result = await cisPersonClient[definition.cisPersonMethod](
        context,
        definition.id,
        definition.value,
      );
    } catch (ex) {
      const error = new Error("Failed to get cis person data");
      this.log(context, {
        message: error.message,
        method: definition && definition.cisPersonMethod,
        error: ex,
      });

      this.error(error);
    }

    return result;
  };
}

export default CisPersonMethod;
