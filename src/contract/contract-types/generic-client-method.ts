import assert from "node:assert";
import ContractExecutable from "../contract-executable.js";
import { Client } from "@earnest/http";

class GenericClientMethod extends ContractExecutable<
  Definition,
  Definition,
  Output
> {
  get executionName(): string {
    return "GenericClientMethod";
  }

  /* eslint-disable-next-line @typescript-eslint/no-unused-vars */
  condition = (_, __, ___, definition: Definition | null) => {
    if (definition) {
      return Boolean(definition.method && definition.uri && definition.baseUrl);
    }
    return false;
  };

  evaluate = async (
    context: Context,
    executionContext,
    input: Input,
    definition: Definition,
  ) => {
    assert(definition, `[591af6b9] missing definitions`);
    const genericClient = new Client({ baseUrl: definition.baseUrl });
    assert(genericClient, `[de484650] invalid client '${genericClient}'`);

    try {
      const { results, response } = await genericClient.request<Output>(
        definition.method,
        {
          uri: definition.uri,
          body: definition.body,
          query: definition.query,
        },
      );

      if (!response.statusCode || response.statusCode >= 400) {
        throw new Error(
          `[717dbe1a] Generic client failed request ${response.statusCode} ${response.statusMessage}`,
        );
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
      this.error(executionContext, error);
      return {
        action: definition.action,
        error,
        results: null,
      };
    }
  };
}

export default GenericClientMethod;
