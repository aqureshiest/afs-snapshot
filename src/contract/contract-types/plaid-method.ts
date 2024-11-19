import assert from "node:assert";
import ContractExecutable from "../contract-executable.js";

class PlaidMethod extends ContractExecutable<Definition, Definition, Output> {
  get executionName(): string {
    return "PlaidMethod";
  }

  /* eslint-disable-next-line @typescript-eslint/no-unused-vars */
  condition = (_, __, ___, definition: Definition) => {
    return Boolean(definition.id);
  };

  /**
   * TODO: use the contracts definition to determine which ApplicationService mutation
   * to apply, and how to construct the payload
   *
   * This function should probably return some information about the event that was created
   */
  evaluate = async function (
    context: Context,
    executionContext,
    input: Input,
    definition: Definition,
  ) {
    const plaidClient = context.loadedPlugins.plaid.instance;
    assert(plaidClient, "[3eac36d3] plaidClient not instantiated");

    try {
      const { id, plaidMethod, payload } = definition;

      const { errors, results } = await (
        plaidClient[plaidMethod] as IPlaidMethod
      )(context, input.application, id, payload as Parameters<IPlaidMethod>[3]);

      if (errors.length) this.error(executionContext, errors);

      return results as Output;
    } catch (ex) {
      this.error(executionContext, ex);
      return {
        method: definition.plaidMethod,
        ContractType: this.executionName,
        error: ex.message,
      };
    }
  };
}

export default PlaidMethod;
