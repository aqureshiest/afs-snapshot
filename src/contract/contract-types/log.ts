/* eslint-disable @typescript-eslint/no-unused-vars */
import assert from "node:assert";
import ContractExecutable from "../contract-executable.js";

/**
 *
 */
class Log extends ContractExecutable<Definition, unknown, void> {
  get executionName(): string {
    return "Log";
  }

  /**
   * Iterate through a list of different authentication strategies and combine their
   * outputs
   */
  evaluate = async function (
    this: Log,
    context: Context,
    input: Input,
    definition: Definition,
  ) {
    const { level, ...message } = definition;
    message.contract = {
      id: this.id,
      parent: this.parent.id,
    };

    message.message = message.message || this.id;

    try {
      context.logger.log(level || "info", message);
    } catch (error) {
      context.logger.warn({
        message: "Logging error",
        error: { messsage: error.message },
      });
    }
  };
}

export default Log;
