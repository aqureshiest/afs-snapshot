import ContractType from "./base-contract.js";

class Noop extends ContractType<void, symbol, symbol> {
  get contractName(): string {
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
