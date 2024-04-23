import assert from "node:assert";
import ContractType from "./base-contract.js";

class PiiRequest extends ContractType<Definition, Definition, Output> {
  get contractName(): string {
    return "PiiRequest";
  }

  condition = (input: Input, context: Injections, definition: Definition) => {
    /**
     * TODO: Add authentication checks
     */

    return Boolean(definition.id);
  };

  evaluate = async (
    input: Input,
    injections: Injections,
    definition: Definition,
  ) => {
    const { context } = injections;
    const piiTokenService =
      context.loadedPlugins.piiTokenServiceClient?.instance;
    assert(
        piiTokenService,
      "[0168364b] PII Token Service client not instantiated",
    );
    
    let result;
    try {
      result = await piiTokenService[definition.piiRequestMethod](
        definition.value,
      );      
    } catch (ex) {
      console.log('[0dd003] AJ DEBUG PiiRequest ERRROR', ex);
      
      console.log(ex);
    }
    
    return result;
  };
}

export default PiiRequest;
