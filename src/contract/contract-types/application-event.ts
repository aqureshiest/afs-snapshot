import { MutationType } from "./base-contract.js";

class ApplicationEvent extends MutationType<Definition, Output> {
  get contractName(): string {
    return "ApplicationEvent";
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
