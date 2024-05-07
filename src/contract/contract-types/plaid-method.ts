import assert from "node:assert";
import ContractType from "./base-contract.js";

class PlaidMethod extends ContractType<Definition, Definition, Output> {
  get contractName(): string {
    return "PlaidMethod";
  }

  /* eslint-disable-next-line @typescript-eslint/no-unused-vars */
  condition = (input: Input, context: Injections, definition: Definition) => {
    return Boolean(definition.id);
  };

  /**
   * TODO: use the contracts definition to determine which ApplicationService mutation
   * to apply, and how to construct the payload
   *
   * This function should probably return some information about the event that was created
   */
  evaluate = async (
    input: Input,
    injections: Injections,
    definition: Definition,
  ) => {
    const { context } = injections;
    const plaidClient = context.loadedPlugins.plaid.instance;
    assert(plaidClient, "[3eac36d3] plaidClient not instantiated");

    try {
      const result = (await plaidClient[definition.plaidMethod](
        context,
        input,
        definition.id,
        definition.payload,
      )) as Output;
      return result;
    } catch (ex) {
      this.error(input, ex.message);
      return {
        method: definition.plaidMethod,
        ContractType: this.contractName,
        error: ex.message,
      };
    }
  };
}

export default PlaidMethod;
