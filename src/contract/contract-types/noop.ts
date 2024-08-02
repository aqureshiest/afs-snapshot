import ContractExecutable from "../contract-executable.js";

class Noop extends ContractExecutable<void, symbol, symbol> {
  get executionName(): string {
    return "Noop";
  }

  static DEFINITION = Symbol("definition");
  static MUTATION = Symbol("mutation");

  evaluate = async () => {
    return Noop.DEFINITION;
  };

  async mutate(context: Context) {
    context.logger.warn({
      message: "Noop contract mutated",
    });
    return Noop.MUTATION;
  }
}

export default Noop;
