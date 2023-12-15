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

  constructor(args: ContractArguments) {
    const { id, definition: rawDefinition, input, context } = args;

    Object.defineProperty(this, "id", {
      value: id,
      enumerable: false,
      writable: false,
    });

    const definition = this.execute(args);

    Object.defineProperty(this, "definition", {
      value: definition,
      enumerable: false,
      writable: false,
    });
  }

  /**
   * Default behavior: return the definition as-is
   */
  execute({ definition }: ContractArguments): unknown {
    return definition;
  }

  toJSON(): unknown {
    return this.definition;
  }

  [Symbol.toStringTag]() {
    return this.contractName;
  }
}

export enum Status {
  Dormant,
  Pending,
  Executing,
  Done,
}

/**
 */
export abstract class MutationType<
  Definition,
  Output,
> extends ContractType<Definition> {
  result: Output;
  resultPromise?: Promise<Output>;

  static Status = Status;

  get status(): Status {
    if (this.result) return Status.Done;
    if (this.resultPromise) return Status.Executing;
    if (this.definition) return Status.Pending;
    return Status.Dormant;
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
    if (this.resultPromise) return this.resultPromise;

    const start = Date.now();

    try {
      this.resultPromise = this.mutate(context, input);
      this.result = await this.resultPromise;

      context.logger.info({
        message: "Mutation executed",
        contract: this.contractName,
        elapsed: Date.now() - start,
      });
    } catch (error) {
      context.logger.error({
        message: "Mutation failed",
        contract: this.contractName,
        elapsed: Date.now() - start,
      });
      throw error;
    }

    return this.result;
  }

  /**
   * Ensure that mutation contracts do not serialize automatically
   */
  toJSON(): unknown {
    return this.definition && (this.result || this);
  }
}
