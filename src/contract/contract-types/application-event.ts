import assert from "node:assert";
import ContractExecutable from "../contract-executable.js";
import { Types as AStypes } from "@earnest/application-service-client";
import * as types from "@earnest/application-service-client/typings/codegen.js";
import { TEMP_DEFAULT_APPLICATION_QUERY } from "../../clients/application-service/graphql.js";

const mutationSchemaQuery = `query schema {
  __type(name: "Mutation") {
    name
      fields {
        name
        args {
          name
          type {
            name
            kind
            ofType {
              name
            }
          }
        }
      }
    }
  }`;

const MUTATIVE_EVENTS = Object.freeze([
  "addDetails",
  "addInformation",
  "addReferences",
  "createApplication",
  "createRelationship",
  "setStatus",
  "removeDetails",
]);

const DESTRUCTIVE_EVENTS = Object.freeze([
  "deleteRelationship",
  "removeReferences",
]);

class ApplicationEvent extends ContractExecutable<
  Definition,
  Definition,
  Output
> {
  get executionName(): string {
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
  condition = (_, __, input: Input, definition: Definition) => {
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
    if (event !== "createApplication" && event !== "create" && !payload?.id) {
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
    context: Context,
    executionContext,
    input: Input,
    definition: Definition,
  ) => {
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
        await applicationServiceClient.getEventInputTypes(
          mutationSchemaQuery,
          context,
        );
      }
    } catch (error) {
      this.log(context, {
        message:
          "[dc77e2d9] Failed to get event types and unable to perform request",
        error,
      });

      throw error;
    }

    if (!applicationServiceClient.eventInputTypes[definition.event]) {
      throw new Error("[694d632f] Event is not defined on event types");
    }

    let requestResult;

    try {
      requestResult = await applicationServiceClient.sendRequest(
        this.buildRequestBody(
          definition,
          applicationServiceClient.eventInputTypes[definition.event],
        ),
        context,
      );
    } catch (ex) {
      const error = new Error("Failed to commit application event");
      /* ============================== *
       * Unexpected errors:
       * ============================== */
      this.log(context, {
        message: error.message,
        error: ex,
        event: definition && definition.event,
      });

      this.error(executionContext, error);

      /* ============================== *
       * TODO: consider alternative return types for this contract-type
       * ============================== */

      return { event: definition.event };
    }

    if (requestResult) {
      const eventResult = requestResult as { [key: string]: types.Event };

      /* ============================== *
       * TODO [LA-714]: application-service needs to be able to provide more nuanced
       * distinction between the types of errors it returns, so that these
       * can be propagated up to the client with appropriate status code
       * and formatting
       * ============================== */

      const { error: errorMessage } = eventResult[definition.event]
        ? eventResult[definition.event]
        : eventResult;

      if (errorMessage && typeof errorMessage === "string") {
        const error = new Error(errorMessage);

        this.error(executionContext, error);
        return { event: definition.event };
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
          this.log(context, {
            message: "failed to rehydrate application",
            error,
            level: "warn",
          });
        }
      }
      return {
        ...eventResult[definition.event],
        event: definition.event,
      };
    } else {
      return { event: definition.event };
    }
  };

  toJSON() {
    if (!this.result) return null;
    return {
      event: this.result?.event,
      id: this.result?.application?.id,
      createdAt: this.result?.createdAt,
      application: this.result?.application,
    };
  }
}

export default ApplicationEvent;
