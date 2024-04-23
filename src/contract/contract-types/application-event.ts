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
    console.log(`[a0e7d7] AJ DEBUG application-event before ${definition.event} request`);
    const query =  this.buildRequestBody(
      definition,
      applicationServiceClient.eventInputTypes[definition.event],
    )
    
    
    try {
      console.log(`[bf2143f1] AJ DEBUG application-event executing ${definition.event} request`);
      console.log('[6d4eef0c] AJ DEBUG query', JSON.stringify(query, null, 2));
      debugger
      const eventResult = (await applicationServiceClient.sendRequest(
        query,
        context,
      )) as { [key: string]: types.Event };
      debugger
      console.log(`[812021ca] AJ DEBUG ${definition.event} eventResult`, eventResult);
      
      const { error } = eventResult[definition.event];
      console.log(`[e102eedd] AJ DEBUG application-event ${definition.event} error`, error);
      
      if (error && typeof error === "string") {
        throw new Error(error);
      }
      return eventResult;
    } catch (e) {
      console.log(`[914414e3] AJ DEBUG application-event ${definition.event} error`, e);
      throw e
    }


    /* ============================== *
     * Rehydration: when application-event evaluates, it should re-hydrate the
     * input parameters for re-evaluation
     * ============================== */
    // const rehydrationId = eventResult[definition.event]?.application?.id;
    // console.log('[5a7cad] AJ DEBUG definition.event ', definition.event);
    // console.log('[6d3953] AJ DEBUG eventResult[definition.event] ', eventResult[definition.event]);
    
    // console.log(`[5adc6b] AJ DEBUG application-event ${definition.event} rehydrationId `, rehydrationId);
    
    // if (rehydrationId) {
    //   try {
    //     const { application } = (await applicationServiceClient.sendRequest(
    //       {
    //         query: TEMP_DEFAULT_APPLICATION_QUERY,
    //         variables: { id: rehydrationId },
    //       },
    //       context,
    //     )) as unknown as { application: types.Application };
    //     console.log(`[60103a] AJ DEBUG rehydrate ${definition.event} application`, application);
        
    //     Object.defineProperty(input, "application", { value: application });  
    //   } catch (error) {
    //     console.log(`[4280d8] AJ DEBUG rehydrate ${definition.event} error`, error);
        
    //     context.logger.warn({
    //       message: "failed to rehydrate application",
    //       contract: this.id,
    //     });
    //   }
    // }
    // console.log(`[b0ca6f] AJ DEBUG application-event ${definition.event} returning result eventResult`, eventResult);
    
    // return eventResult;
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
