import assert from "node:assert";
import ContractType from "./base-contract.js";
class Error extends ContractType<Definition, Definition, Output> {
  get contractName(): string {
    return "PlaidMethod";
  }
  /* eslint-disable-next-line @typescript-eslint/no-unused-vars */
  condition = (input: Input, context: Injections, definition: Definition) => {
    return Boolean(definition.error);
  };
  evaluate = async (
    input: Input,
    injections: Injections,
    definition: Definition,
  ) => {
    const { context } = injections;
    this.error(input, definition.error);
    return {
      error: definition.error,
      contractType: this.contractName,
    };
  };
}
export default Error;
