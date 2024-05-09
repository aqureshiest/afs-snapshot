import assert from "node:assert";
import ContractType from "./base-contract.js";

const VALID_CLIENTS = Object.freeze(["internalRestServiceClient"] as const);

class ClientMethod extends ContractType<Definition, Transformation, Output> {
  get contractName(): string {
    return "ClientMethod";
  }

  /**
   * instead of returning invalid contract bodies verbatim that will never be evaluated, return null
   */
  transform = (input: Input, definition: Transformation) => {
    if (
      definition &&
      VALID_CLIENTS.includes(
        definition.client as (typeof VALID_CLIENTS)[number],
      )
    ) {
      return definition;
    }

    return null;
  };

  /* eslint-disable-next-line @typescript-eslint/no-unused-vars */
  condition = (
    input: Input,
    context: Injections,
    definition: Definition | null,
  ) => {
    return Boolean(definition);
  };

  /**
   * TODO: use the contracts definition to determine which redis volatile state method
   * to call
   *
   * This function should return the result of the method called
   */
  evaluate = async (
    input: Input,
    injections: Injections,
    definition: Definition,
  ) => {
    const { context } = injections;
    const clientName = definition.client as (typeof VALID_CLIENTS)[number];
    const client = context.loadedPlugins[clientName]?.instance;

    assert(client, `[b7949087] invalid client '${clientName}'`);

    const { method, uri, body, query } = definition;

    const { results, response } = await client.request<Output>(
      method,
      {
        uri,
        body,
        query,
      },
      context,
    );

    if (!response.statusCode || response.statusCode >= 400) {
      client.log(
        {
          level: "warn",
          results,
        },
        context,
      );

      return {
        statusCode: response.statusCode || null,
        message: response.statusMessage,
      };
    }

    return results;
  };
}

export default ClientMethod;
