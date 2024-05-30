import assert from "node:assert";
import ContractType from "./base-contract.js";
import { Types as AStypes } from "@earnest/application-service-client";
import * as types from "@earnest/application-service-client/typings/codegen.js";
import { TEMP_DEFAULT_APPLICATION_QUERY } from "../../clients/application-service/graphql.js";

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

  buildRequestBody(definition: Definition, inputTypes): AStypes.GqlRequestBody {
    const { event, fields = "", payload = {} } = definition;
    const varsArray: string[] = [];
    const typesArray: string[] = [];

    for (const [key, value] of Object.entries(inputTypes)) {
      varsArray.push(`${key}: $${key}`);
      typesArray.push(`$${key}: ${value}`);
    }

    const vars = varsArray.join(", ");
    const types = typesArray.join(", ");

    return {
      query: `mutation(${types}) {
        ${event}(${vars}){
          ${fields}
          createdAt
          error
        }
      }`,
      variables: { ...payload, meta: { service: "apply-flow-service" } },
    };
  }

  /**
   */
  condition = (input: Input, context: Injections, definition: Definition) => {
    const method = input.request?.method;

    const { event, payload } = definition;

    // 1. Any event that destroys data cannot be done with a request if it
    // isn't a DELETE request
    if (method && method !== "DELETE" && DESTRUCTIVE_EVENTS.includes(event)) {
      console.log('[50e768] AJ DEBUG tried to delete ', event);
      
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

    /* ============================== *
     * Fetch input types to dynamically
     * build mutation request
     * ============================== */
    try {
      if (!applicationServiceClient.eventInputTypes) {
        await applicationServiceClient.getEventInputTypes(injections);
      }
    } catch (error) {
      context.logger.error({
        error,
        message:
          "[dc77e2d9] Failed to get event types and unable to perform request",
      });
      throw error;
    }

    if (!applicationServiceClient.eventInputTypes[definition.event]) {
      throw new Error("[694d632f] Event is not defined on event types");
    }
    let requestResult;
    const requestBody = this.buildRequestBody(
      definition,
      applicationServiceClient.eventInputTypes[definition.event],
    )
    console.log('[42e8bc] AJ DEBUG requestBody', requestBody);
    
    try {
      requestResult = await applicationServiceClient.sendRequest(
        requestBody,
        context,
      );
    } catch (error) {
      if (error) {
        try {
          const arrayError = JSON.parse(error.message);
          this.error(input, arrayError);
        } catch (ex) {
          this.error(input, ex);
        }
      }
      return {};
    }

    if (requestResult) {
      const eventResult = requestResult as { [key: string]: types.Event };
      const { error } = eventResult[definition.event]
        ? eventResult[definition.event]
        : eventResult;

      if (error && typeof error === "string") {
        this.error(input, error);
        return {};
      }
      /* ============================== *
       * Rehydration: when application-event evaluates, it should re-hydrate the
       * input parameters for re-evaluation
       * ============================== */
      const rehydrationId = eventResult[definition.event]?.application?.id;

      if (rehydrationId) {
        try {
          const { application } = (await applicationServiceClient.sendRequest(
            {
              query: TEMP_DEFAULT_APPLICATION_QUERY,
              variables: { id: rehydrationId },
            },
            context,
          )) as unknown as { application: types.Application };

          Object.defineProperty(input, "application", { value: application });
        } catch (error) {
          this.error(
            input,
            `[ba26622c] failed ${this.contractName}:\n${error.message}`,
          );
          context.logger.warn({
            message: "failed to rehydrate application",
            contract: this.id,
          });
        }
      }
      return eventResult;
    } else {
      return {};
    }
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
