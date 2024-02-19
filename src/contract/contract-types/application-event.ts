import assert from "node:assert";
import ContractType from "./base-contract.js";
import { GqlRequestBody } from "@earnest/application-service-client";
import * as types from "@earnest/application-service-client/typings/codegen.js";
import { TEMP_DEFAULT_APPLICATION_QUERY, mutationSchemaQuery } from "../../clients/application-service/graphql.js";


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
  private eventInputTypes;

  get contractName(): string {
    return "ApplicationEvent";
  }

  buildRequestBody(definition: Definition, inputTypes): GqlRequestBody {
    const { event, fields = "", payload = {} }  = definition;
    return {
      query: `mutation (${Object.values(inputTypes).join(",")}) {
        ${event} {
          ${fields}
          createdAt
          error
        }
      }`,
      variables: { ...payload, meta: { service: "apply-flow-service" } }
    }
  }

  getInputTypes = async(injections: Injections) => {
    const { context } = injections;

    const applicationServiceClient = context.loadedPlugins.applicationServiceClient.instance;
    assert(
      applicationServiceClient,
      "[c89c0f75] ApplicationServiceClient not initialized",
    );

    const schema = await applicationServiceClient.sendRequest({
      query: mutationSchemaQuery
    }) as MutationSchema;

    this.eventInputTypes = schema.__type.fields.reduce((acc, field) => {
      const { name: fieldName, args } = field;

      const inputs = args.reduce((argAcc, arg) => {
        const {
          name: argName,
          type: { kind, name: typeName, ofType },
        } = arg;

        if (kind === "INPUT_OBJECT") {
          argAcc[argName] = typeName;
        }

        if (kind === "LIST" && ofType != null) {
          argAcc[argName] = `[${ofType.name}]`;
        }

        if (kind === "NON_NULL" && ofType != null) {
          argAcc[argName] = `${ofType.name}!`;
        }

        return argAcc;
      }, {});

      acc[fieldName] = inputs;

      return acc;
    }, {});
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
    /* ============================== *
     * Fetch input types to dynamically
     * build mutation request
     * ============================== */
    try {
      if (!this.eventInputTypes) {
        await this.getInputTypes(injections)
      }
    } catch(error) {
      context.logger.error({
        error,
        message: "[dc77e2d9] Failed to get event types"
      });
      throw error;
    }

    if (!this.eventInputTypes[definition.event]) {
      throw new Error("[694d632f] Event is not defined on event types");
    }

    const eventResult = (await applicationServiceClient.sendRequest(
      this.buildRequestBody(definition, this.eventInputTypes[definition.event]),
      context
    )) as types.Event;

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
        const application = await applicationServiceClient.sendRequest({
          query: TEMP_DEFAULT_APPLICATION_QUERY,
          variables: { id: rehydrationId },
        }, context);

        Object.defineProperty(input, "application", { value: application });
      } catch (error) {
        context.logger.warn({
          message: "failed to rehydrate application",
          contract: this.id,
        });
      }
    }

    return eventResult;
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
