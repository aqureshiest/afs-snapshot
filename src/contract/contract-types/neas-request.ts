import assert from "node:assert";
import ContractExecutable from "../contract-executable.js";

class NeasRequest extends ContractExecutable<Definition, Definition, Output> {
  get executionName(): string {
    return "NeasRequest";
  }

  condition = (_, __, transformation: Definition) => {
    return Boolean(transformation && transformation.neasMethod);
  };

  evaluate = async (context: Context, input: Input, definition: Definition) => {
    const neasClientService = context.loadedPlugins.NeasClient?.instance;
    assert(
      neasClientService,
      "[2379444k] Neas Service client not instantiated",
    );

    let result;
    try {
      result = await neasClientService[definition.neasMethod](context, input);
    } catch (ex) {
      context.logger.error(ex);
      this.error(ex);
    }

    return result;
  };
}

export default NeasRequest;
