import assert from "node:assert";
import { MutationType } from "./base-contract.js";

class ApplicationEvent extends MutationType<Definition, Output> {
  get contractName(): string {
    return "ApplicationEvent";
  }

  /**
   * TODO: use the contracts definition to determine which ApplicationService mutation
   * to apply, and how to construct the payload
   *
   * This function should probably return some information about the event that was created
   */
  async mutate(context: Context) {
    const applicationServiceClient =
      context.loadedPlugins.applicationServiceClient.instance;
    assert(
      applicationServiceClient,
      "[7d3b096f] ApplicationServiceClient not instantiated",
    );

    const { event, fields = [], payload } = this.definition;

    const { [event]: eventResult } = await applicationServiceClient.mutate(
      context,
      event,
      {
        fields: [...fields, "createdAt"],
        data: payload,
        meta: {
          service: "apply-flow-service",
        },
      },
    );

    return eventResult as Output;
  }

  toJSON() {
    return {
      event: this.definition?.event,
      id: this.result?.id,
      createdAt: this.result?.createdAt,
    };
  }
}

export default ApplicationEvent;
