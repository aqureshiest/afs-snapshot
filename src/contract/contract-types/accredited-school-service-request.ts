import assert from "node:assert";
import ContractType from "./base-contract.js";

class AccreditedSchoolServiceRequest extends ContractType<
  Definition,
  Definition,
  Output
> {
  get contractName(): string {
    return "AccreditedSchoolServiceRequest";
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
    const accreditedSchoolServiceClient =
      context.loadedPlugins.accreditedSchoolService?.instance;
    assert(
      accreditedSchoolServiceClient,
      "[2aef0653] Accredited School Service client not instantiated",
    );

    let result;
    try {
      result = await accreditedSchoolServiceClient[
        definition.accreditedSchoolServiceRequestMethod
      ](definition.search);
    } catch (ex) {
      context.logger.info({
        messege: "[4fe92134] School Service :: HELLO WORLD",
        ...ex,
      });
      context.logger.error(ex);
    }

    return result;
  };
}

export default AccreditedSchoolServiceRequest;
