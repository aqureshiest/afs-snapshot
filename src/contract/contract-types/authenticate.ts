import assert from "node:assert";
import ContractExecutable from "../contract-executable.js";
import createError from "http-errors";

/**
 *
 */
class Authenticate extends ContractExecutable<Definition, Output, Output> {
  get executionName(): string {
    return "Authenticate";
  }

  /**
   * Iterate through a list of different authentication strategies and combine their
   * outputs
   */
  transform(
    context: Context,
    executionContext: ExecutionContext,
    definition: Definition,
  ): Output {
    const { /*mode,*/ strategies } = definition;

    const authentication = strategies.reduce(
      (auth, strategy) => {
        const strategySet = new Set(auth.strategies);

        const isValid = Boolean(
          strategy.mode === AuthMode.Required
            ? auth.isValid !== false && strategy.isValid
            : auth.isValid || strategy.isValid,
        );

        const isAuthorized = Boolean(
          strategy.mode === AuthMode.Required
            ? auth.isAuthorized !== false && strategy.isAuthorized
            : auth.isAuthorized || strategy.isAuthorized,
        );

        if (strategy.isValid && strategy.strategy) {
          strategySet.add(strategy.strategy);
        }

        return {
          strategies: Array.from(strategySet),
          isInternal: Boolean(auth.isInternal || strategy.isInternal),
          isAuthorized,
          isValid,
          artifacts: (auth.artifacts || strategy.artifacts) && {
            ...auth?.artifacts,
            ...strategy?.artifacts,
          },
        };
      },
      {
        strategies: [],
        isInternal: false,
        artifacts: {},
      } as unknown as Auth,
    );

    const { errors } = executionContext;

    if (!errors || !(this.id in errors)) {
      if (authentication.isValid === false) {
        this.error(
          executionContext,
          createError.BadRequest("invalid credentials"),
        );
      } else if (authentication.isAuthorized === false) {
        if (authentication.strategies.length === 0) {
          this.error(executionContext, createError.Unauthorized());
        } else {
          this.error(executionContext, createError.Forbidden());
        }
      }
    }

    return authentication;
  }
}

export default Authenticate;
