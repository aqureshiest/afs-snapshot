import { MutationType } from "./base-contract.js";

class Noop extends MutationType<void, void> {
  get contractName(): string {
    return "Noop";
  }

  async mutate(context: Context) {
    context.logger.warn({
      message: "Noop contract mutated",
    });
  }

  toJSON() {
    return this.definition;
  }
}

export default Noop;
