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
        context,
        definition.value,
      );
    } catch (ex) {
      context.logger.info({
        messege: "[fbcd8ef5] Pii Token :: HELLO WORLD",
        ...ex,
      });
      context.logger.error(ex);
    }

    return result;
  };
}

export default PiiRequest;
