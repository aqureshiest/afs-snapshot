/* eslint-disable @typescript-eslint/no-unused-vars */
import assert from "node:assert";
import ContractExecutable from "../contract-executable.js";

/**
 *
 */
class Log extends ContractExecutable<Definition, unknown, void> {
  get executionName(): string {
    return "Cookie";
  }

  /**
   * Do not process the authorization error checks until all dependencies have been processed
   */
  condition = function (this: Log, _, __, ___, definition: Definition | null) {
    const incompleteDependencies = Object.values(this.dependencies).some(
      (dependency) => dependency.isIncomplete(_, __, ___),
    );
    return !incompleteDependencies && Boolean(definition);
  };

  /**
   * Iterate through a list of different authentication strategies and combine their
   * outputs
   */
  evaluate = async function (
    this: Log,
    context: Context,
    executionContext: ExecutionContext,
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
