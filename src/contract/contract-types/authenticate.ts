/* eslint-disable @typescript-eslint/no-unused-vars */
import assert from "node:assert";
import ContractExecutable from "../contract-executable.js";
import createError from "http-errors";

class Authenticate extends ContractExecutable<Definition, Output, Output> {
  get executionName(): string {
    return "Authenticate";
  }

  transform(_, definition) {
    const { /*mode,*/ strategies } = definition;

    const authorization = strategies.reduce(
      (auth, strategy) => {
        const strategySet = new Set(auth.strategies);

        const isValid =
          strategy.mode === AuthMode.Required
            ? Boolean(auth.isValid !== false && strategy.isValid)
            : auth.isValid || strategy.isValid;

        const isAuthorized =
          strategy.mode === AuthMode.Required
            ? Boolean(auth.isAuthorized !== false && strategy.isAuthorized)
            : auth.isAuthorized || strategy.isAuthorized;

        if (strategy.isValid != null && strategy.strategy) {
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

    return authorization;
  }

  /**
   * Do not process the authorization error checks until all dependencies have been processed
   */
  condition = function (
    this: Authenticate,
    _,
    __,
    authorization: Output | null,
  ) {
    return Boolean(authorization);
  };

  /**
   * Iterate through a list of different authentication strategies and combine their
   * outputs
   */
  evaluate = async function (
    this: Authenticate,
    context: Context,
    input: Input,
    authentication: Output,
  ) {
    const { errors } = this;

    if (!errors || !(this.id in errors)) {
      if (authentication.isValid === false) {
        this.error(createError.BadRequest("invalid credentials"));
      } else if (authentication.isAuthorized === false) {
        if (authentication.strategies.length === 0) {
          this.error(createError.Unauthorized());
        } else {
          this.error(createError.Forbidden());
        }
      }
    }

    return authentication;
  };
}

export default Authenticate;
