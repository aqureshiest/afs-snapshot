import assert from "node:assert";
import ContractExecutable from "../contract-executable.js";
import createError from "http-errors";
import { IncomingMessage } from "http";
import path from "node:path";

const VALID_CLIENTS = Object.freeze([
  "accreditedSchoolService",
  "internalRestServiceClient",
  "notificationServiceClient",
  "lendingDecisionServiceClient",
  "NeasClient",
  "plaid",
  "piiTokenServiceClient",
  "calculatorServiceClient",
  "partnerClient",
  "cisPersonClient",
  "optimizelyClient",
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
  condition = (_, __, transformation: Transformation | null) => {
    const canSendRequest =
      transformation &&
      transformation.uri &&
      transformation.method &&
      VALID_CLIENTS.includes(
        transformation.client as (typeof VALID_CLIENTS)[number],
      );

    return Boolean(canSendRequest);
  };

  /**
   * TODO: use the contracts definition to determine which redis volatile state method
   * to call
   *
   * This function should return the result of the method called
   */
  evaluate = async (context: Context, input: Input, definition: Definition) => {
    const clientName = definition.client as (typeof VALID_CLIENTS)[number];
    const client = context.loadedPlugins[clientName]?.instance;

    assert(client, `[b7949087] invalid client '${clientName}'`);

    const { action, required, method, uri, body, query, headers, resiliency } =
      definition;

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

      /* ============================== *
       * Client methods that are defined as required will surface the failed request as a contract execution error
       * ============================== */

      if (
        required &&
        (!response.statusCode ||
          response.statusCode >= 400 ||
          response.statusCode < 200)
      ) {
        /* ============================== *
         * TODO: determine if it's safe to record or transmit non-200 response bodies along with the other error data
         * ============================== */
        const error = createError(response.statusCode || 500, {
          cause: {
            contract: this.parent.id,
            url: path.join(client.baseUrl, uri),
            method,
            action,
          },
        });
        this.error(error);
      }

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
      this.error(error);

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
