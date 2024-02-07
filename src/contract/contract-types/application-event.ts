import assert from "node:assert";
import ContractType from "./base-contract.js";

const MUTATIVE_EVENTS = Object.freeze([
  "addDetails",
  "addInformation",
  "addReferences",
  "createApplication",
  "createRelationship",
  "setStatus",
]);

const DESTRUCTIVE_EVENTS = Object.freeze([
  "deleteRelationship",
  "removeDetails",
  "removeReferences",
]);

class ApplicationEvent extends ContractType<Definition, Definition, Output> {
  get contractName(): string {
    return "ApplicationEvent";
  }

  /**
   */
  condition = (input: Input, context: Injections, definition: Definition) => {
    const method = input.request?.method;

    const { event, payload } = definition;

    // 1. Any event that destroys data cannot be done with a request if it
    // isn't a DELETE request
    if (method && method !== "DELETE" && DESTRUCTIVE_EVENTS.includes(event)) {
      return false;
    }

    // 2. Any event that can change data cannot run during a GET request
    if (method === "GET" && MUTATIVE_EVENTS.includes(event)) {
      return false;
    }

    // 3. Any event other than "createApplication" requires an id
    if (event !== "createApplication" && !payload?.id) {
      return false;
    }

    return true;
  };

  /**
   * TODO: use the contracts definition to determine which ApplicationService mutation
   * to apply, and how to construct the payload
   *
   * This function should probably return some information about the event that was created
   */
  evaluate = async (
    input: Input,
    injections: Injections,
    definition: Definition,
  ) => {
    const { context } = injections;
    const applicationServiceClient =
      context.loadedPlugins.applicationServiceClient.instance;
    assert(
      applicationServiceClient,
      "[7d3b096f] ApplicationServiceClient not instantiated",
    );

    const { event, fields = [], payload } = definition;

    const { [event]: eventResult } = await applicationServiceClient.mutate(
      context,
      event,
      {
        fields: [...fields, "createdAt", "error"],
        data: payload,
        meta: {
          service: "apply-flow-service",
        },
      },
    );

    const { error } = eventResult;

    if (error && typeof error === "string") {
      throw new Error(error);
    }

    /* ============================== *
     * Rehydration: when application-event evaluates, it should re-hydrate the
     * input parameters for re-evaluation
     * ============================== */
    const rehydrationId = eventResult?.application?.id;

    if (rehydrationId) {
      try {
        const application = await applicationServiceClient.getApplication(
          context,
          eventResult.application.id as string,
        );

        Object.defineProperty(input, "application", { value: application });
      } catch (error) {
        context.logger.warn({
          message: "failed to rehydrate application",
          contract: this.id,
        });
      }
    }

    return eventResult as Output;
  };

  toJSON() {
    if (!this.result) return null;
    return {
      event: this.result?.event,
      id: this.result?.id,
      createdAt: this.result?.createdAt,
    };
  }
}

export default ApplicationEvent;
