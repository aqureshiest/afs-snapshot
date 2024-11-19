import ContractExecutable from "../contract-executable.js";
import createError from "http-errors";

class Error extends ContractExecutable<Definition, Definition, Output> {
  get executionName(): string {
    return "Error";
  }
  /* eslint-disable-next-line @typescript-eslint/no-unused-vars */
  condition = (_, __, ___, definition: Definition) => {
    return Boolean(definition.error);
  };
  evaluate = async (
    _,
    evaluationContext,
    input: Input,
    definition: Definition,
  ) => {
    const { statusCode = 500, error: message, ...properties } = definition;

    const errorMessages = Array.isArray(message) ? message : [message];

    const errors = errorMessages.map((errorMessage) =>
      createError(statusCode, errorMessage, properties),
    );

    this.error(evaluationContext, errors);
    return {
      error: definition.error,
      contractType: this.executionName,
    };
  };
}
export default Error;
