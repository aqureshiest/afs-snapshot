import ContractExecutable from "../contract-executable.js";

class Noop extends ContractExecutable<void, symbol, symbol> {
  get executionName(): string {
    return "Noop";
  }

  evaluate = async (_, __, definition) => {
    return definition;
  };
}

export default Noop;
