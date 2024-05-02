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
    return Boolean(definition.accreditedSchoolServiceRequestMethod);
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

    try {
      const result = await accreditedSchoolServiceClient[
        definition.accreditedSchoolServiceRequestMethod
      ](context, definition);
      return result;
    } catch (ex) {
      this.error(
        input,
        `[626627ed] failed ${this.contractName}:\n${ex.message}`,
      );
      context.logger.error({
        message: "[4fe92134] School Service Contract Failed",
        error: ex,
      });
      return [];
    }
  };
}

export default AccreditedSchoolServiceRequest;
