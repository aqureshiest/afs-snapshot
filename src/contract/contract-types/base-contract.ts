/* eslint-disable @typescript-eslint/no-unused-vars */
/**
 * Each ContractType class describes a different type of contract that can be executed
 */
export default abstract class ContractType<Definition> {
  get contractName(): string {
    return "Contract";
  }

  definition: Definition;
  input?: Input;

  constructor(definition: unknown, input?: Input) {
    Object.defineProperty(this, "definition", {
      value: definition,
      enumerable: true,
      writable: false,
    });
    Object.defineProperty(this, "input", {
      value: input,
      enumerable: false,
      writable: false,
    });
  }

  /**
   * An instance of a  ContractType
   */
  toJSON() {
    throw new Error(
      `ContractType '${this.contractName}' has not implemented a toJSON method`,
    );
  }

  [Symbol.toStringTag]() {
    return this.contractName;
  }
}

/**
 */
export abstract class MutationType<
  Definition,
  Output,
> extends ContractType<Definition> {
  result: Output;

  /**
   *
   */
  async mutate(context: Context): Promise<Output> {
    throw new Error(
      `MutationType '${this.contractName}' does not have a mutation method`,
    );
  }

  /**
   * Run this mutation and record the result for serialization
   */
  async run(context: Context): Promise<Output> {
    const start = Date.now();

    const result = await this.mutate(context);
    this.result = result;

    context.logger.info({
      message: "Mutation executed",
      contract: this.contractName,
      elapsed: Date.now() - start,
    });

    return this.result;
  }

  /**
   * Ensure that mutation contracts do not serialize automatically
   */
  toJSON() {
    return this.definition && (this.result || this);
  }
}
