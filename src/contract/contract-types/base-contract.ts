/* eslint-disable @typescript-eslint/no-unused-vars */
/**
 * Each ContractType class describes a different type of contract that can be executed
 */
export default abstract class ContractType<Definition> {
  id: string;

  get contractName(): string {
    return "Contract";
  }

  definition: Definition;

  constructor(id: string, definition: unknown) {
    Object.defineProperty(this, "id", {
      value: id,
      enumerable: false,
      writable: false,
    });
    Object.defineProperty(this, "definition", {
      value: definition,
      enumerable: true,
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
  mutated: boolean;

  constructor(id: string, definition: unknown) {
    super(id, definition);
    Object.defineProperty(this, "mutated", {
      value: false,
      enumerable: false,
      writable: true,
    });
  }

  /**
   *
   */
  async mutate(context: Context, input: Input): Promise<Output> {
    throw new Error(
      `MutationType '${this.contractName}' does not have a mutation method`,
    );
  }

  /**
   * Run this mutation and record the result for serialization
   */
  async run(context: Context, input: Input): Promise<Output> {
    const start = Date.now();

    const result = await this.mutate(context, input);
    this.result = result;
    Object.defineProperty(this, "mutated", {
      value: true,
      enumerable: false,
      writable: true,
    });

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
  toJSON(): unknown {
    return this.definition && (this.result || this);
  }
}
