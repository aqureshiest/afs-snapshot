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
  condition = function (this: Cookie, _, __, definition: Definition | null) {
    return Boolean(definition);
  };

  /**
   * Iterate through a list of different authentication strategies and combine their
   * outputs
   */
  evaluate = async function (
    context: Context,
    input: Input,
    definition: Definition,
  ) {
    const { name, value, options = {} } = definition;
    // prevents default encoding behavior
    options.encode = (cookie) => cookie;

    if (value) {
      input.response?.cookie(name, value, options);
    }

    return { action: name, success: Boolean(value) };
  };
}

export default Cookie;
