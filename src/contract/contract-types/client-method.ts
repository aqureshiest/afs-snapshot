import assert from "node:assert";
import ContractExecutable from "../contract-executable.js";
import createError from "http-errors";
import { IncomingMessage } from "http";

const VALID_CLIENTS = Object.freeze([
  "accreditedSchoolService",
  "internalRestServiceClient",
  "notificationServiceClient",
  "lendingDecisionServiceClient",
  "NeasClient",
  "plaid",
  "piiTokenServiceClient",
  "calculatorServiceClient",
] as const);

class ClientMethod extends ContractExecutable<
  Definition,
  Transformation,
  Output
> {
  get executionName(): string {
    return "ClientMethod";
  }

  /* eslint-disable-next-line @typescript-eslint/no-unused-vars */
  condition = (_, __, ___, transformation: Transformation | null) => {
    const incompleteDependencies = Object.values(this.dependencies).some(
      (dependency) => dependency.isIncomplete(_, __, ___),
    );

    const canSendRequest =
      transformation &&
      transformation.uri &&
      transformation.method &&
      VALID_CLIENTS.includes(
        transformation.client as (typeof VALID_CLIENTS)[number],
      );

    return !incompleteDependencies && Boolean(canSendRequest);
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

    const { method, uri, body, query, headers, resiliency } = definition;

    try {
      const { results, response } = await client.request(
        method,
        {
          uri,
          body,
          query,
          headers,
          resiliency,
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

      this.log(context, {
        error,
        message: `[d576aec7] ClientMethod contract-type failed on ${client} request`,
      });

      return {
        action: definition.action,
        error,
        results: null,
      };
    }
  };
}

export default ClientMethod;
