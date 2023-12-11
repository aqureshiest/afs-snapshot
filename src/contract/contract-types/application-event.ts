import { MutationType } from "./base-contract.js";
import { v4 as uuid } from "uuid";

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
  async mutate(context: Context, input: Input) {
    context.logger.warn({
      message: "ApplicationEvent has not been implemented",
      event: this.definition.event,
    });

    return { id: uuid(), application: input.application || { id: uuid() } };
  }
}

export default ApplicationEvent;
