/* eslint-disable @typescript-eslint/no-unused-vars */
import assert from "node:assert";
import ContractExecutable from "../contract-executable.js";
import createError from "http-errors";

/**
 *
 */
class Validate extends ContractExecutable<
  Definition,
  Transformation,
  Transformation
> {
  get executionName(): string {
    return "Validate";
  }

  transform(
    this: Validate,
    context: Context,
    executionContext: ExecutionContext,
    definition: Definition,
  ): Transformation {
    const { schema, payload, onError } = definition;
    const ajv = context.loadedPlugins.schema.instance;

    if (ajv && schema) {
      const isValid = ajv.validate(schema, payload);
      const errors = ajv.errors as Transformation["errors"];

      return {
        isValid,
        errors,
        onError,
        payload,
      };
    }

    return {
      isValid: null,
      payload,
    };
  }

  /**
   * Only do validation evaluation if
   */
  condition(this: Validate, _, __, ___, transformation: Transformation) {
    return Boolean(transformation.errors);
  }

  /**
   * Iterate through a list of different authentication strategies and combine their
   * outputs
   */
  evaluate = async function (
    this: Validate,
    context: Context,
    executionContext: ExecutionContext,
    input: Input,
    transformation: Transformation,
  ) {
    const { errors, onError } = transformation;

    if (errors && onError) {
      errors.forEach((validationError) => {
        const statusCode =
          (typeof onError === "object" && onError.statusCode) || 500;
        const message =
          (typeof onError === "object" && onError.message) ||
          validationError.message ||
          "validation error";
        const httpError = createError(statusCode, message, {
          cause: validationError,
        });
        this.error(executionContext, httpError);
      });
    }

    return transformation;
  };
}

export default Validate;
