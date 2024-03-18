import assert from "node:assert";
import ContractType from "./base-contract.js";

class PlaidMethod extends ContractType<Definition, Definition, Output> {
  get contractName(): string {
    return "PlaidMethod";
  }

  /**
   */
  condition = (input: Input, context: Injections, definition: Definition) => {
    const method = input.request?.method;

    const { event, payload } = definition;
    
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
    console.log('======= aqui')
    const { context } = injections;
    const plaidClient = context.loadedPlugins.plaid.instance;
    assert(plaidClient, "[3eac36d3] plaidClient not instantiated");
    let result;
    try {
      console.log(`Executing method ${definition.method}`, definition.payload)
      result = await plaidClient[definition.method](context, definition.id, definition.payload);
    } catch (ex) {
      console.log(ex);
    }

    return result;
  };

  // toJSON() {
  //   if (!this.result) return null;
  //   return {
  //     event: this.result?.event,
  //     id: this.result?.id,
  //     createdAt: this.result?.createdAt,
  //   };
  // }
}

export default PlaidMethod;
