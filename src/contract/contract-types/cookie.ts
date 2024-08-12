/* eslint-disable @typescript-eslint/no-unused-vars */
import assert from "node:assert";
import ContractExecutable from "../contract-executable.js";

/**
 *
 */
class Cookie extends ContractExecutable<Definition, Definition, Output> {
  get executionName(): string {
    return "Cookie";
  }

  /**
   * Do not process the authorization error checks until all dependencies have been processed
   */
  condition = function (
    this: Cookie,
    _,
    __,
    ___,
    definition: Definition | null,
  ) {
    return Boolean(definition);
  };

  /**
   * Iterate through a list of different authentication strategies and combine their
   * outputs
   */
  evaluate = async function (
    context: Context,
    executionContext: ExecutionContext,
    input: Input,
    definition: Definition,
  ) {
    const { name, value, options } = definition;

    if (value) {
      options
        ? input.response?.cookie(name, value, options)
        : input.response?.cookie(name, value);
    } else {
      input.response?.clearCookie(name);
    }

    return { action: name, success: Boolean(value) };
  };
}

export default Cookie;
