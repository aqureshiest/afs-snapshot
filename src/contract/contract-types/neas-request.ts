import assert from "node:assert";
import ContractType from "./base-contract.js";

class NeasRequest extends ContractType<Definition, Definition, Output> {
  get contractName(): string {
    return "NeasRequest";
  }

  condition = (input: Input, context: Injections, definition: Definition) => {
    return Boolean(definition && definition.neasMethod);
  };

  evaluate = async (
    input: Input,
    injections: Injections,
    definition: Definition,
  ) => {
    const { context } = injections;
    const neasClientService = context.loadedPlugins.NeasClient?.instance;
    assert(
      neasClientService,
      "[2379444k] Neas Service client not instantiated",
    );

    let result;
    try {
      result = await neasClientService[definition.neasMethod](injections);
    } catch (ex) {
      this.error(
        input,
        `[k5693y67] failed ${this.contractName}:\n${ex.message}`,
      );
      context.logger.info({
        messege: "[twth9ej8] Neas Contract Failed",
        ...ex,
      });
      context.logger.error(ex);
    }

    return result;
  };
}

export default NeasRequest;
