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
    context.logger.warn({
      message: "ApplicationEvent has not been implemented",
      event: this.definition.event,
    });
  }

  /**
   * TODO: mutations should each have their coercion rules
   * so they can interact with conditional contract execution
   */
  [Symbol.toPrimitive](hint) {
    switch (hint) {
      case "number":
        return 1;
      case "string":
        return this.definition.event;
    }
  }
}

export default ApplicationEvent;
