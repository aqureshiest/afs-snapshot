import assert from "node:assert";
import ContractExecutable from "../contract-executable.js";
import createError from "http-errors";
import { IncomingMessage } from "http";

const VALID_CLIENTS = Object.freeze([
  "internalRestServiceClient",
  "NeasClient",
  "plaid",
  "piiTokenServiceClient",
] as const);

class ClientMethod extends ContractExecutable<
  Definition,
  Transformation,
  Output
> {
  get executionName(): string {
    return "ClientMethod";
  }

  /**
   * instead of returning invalid contract bodies verbatim that will never be evaluated, return null
   */
  transform = (_, __, definition: Definition) => {
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
  condition = (_, __, ___, transformation: Transformation | null) => {
    return Boolean(transformation);
  };

  /**
   * TODO: use the contracts definition to determine which redis volatile state method
   * to call
   *
   * This function should return the result of the method called
   */
  evaluate = async (
    context: Context,
    executionContext,
    input: Input,
    definition: Definition,
  ) => {
    const clientName = definition.client as (typeof VALID_CLIENTS)[number];
    const client = context.loadedPlugins[clientName]?.instance;

    assert(client, `[b7949087] invalid client '${clientName}'`);

    const { method, uri, body, query, headers } = definition;

    try {
      const { results, response } = await client.request(
        method,
        {
          uri,
          body,
          query,
          headers,
        },
        context,
      );

      return {
        action: definition.action,
        results,
        response: {
          statusCode: response.statusCode,
          statusMessage: response.statusMessage,
          headers: response.headers,
        },
      };
    } catch (error) {
      this.error(executionContext, error);

      return {
        action: definition.action,
        error,
        results: null,
      };
    }
  };
}

export default ClientMethod;
