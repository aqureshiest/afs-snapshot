/* eslint-disable @typescript-eslint/no-unused-vars */
/**
 * Each ContractType class describes a different type of contract that can be executed
 */
export default abstract class ContractType<Definition> {
  get contractName(): string {
    return "Contract";
  }

  static coercions = Object.freeze({
    string(this: ContractType<unknown>) {
      return this[Symbol.toPrimitive]("string");
    },
    number(this: ContractType<unknown>) {
      return this[Symbol.toPrimitive]("number");
    },
    boolean(this: ContractType<unknown>, input): boolean {
      return Boolean(input);
    },
  });

  [Symbol.toPrimitive](hint) {
    switch (hint) {
      case "number":
        if (typeof this.definition === "number") {
          return this.definition;
        }
        return this.definition ? 1 : 0;
      case "string":
        if (typeof this.definition === "string") {
          return this.definition;
        }
        return JSON.stringify(this.definition);
    }
  }

  definition: Definition;
  input: Input;

  coercion?: Coercion<unknown, unknown>;

  constructor(definition: unknown, input: Input) {
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

  coerce(coercion?: string) {
    if (!coercion) {
      Object.defineProperty(this, "coercion", {
        value: undefined,
        enumerable: false,
        writable: true,
      });
      return;
    }

    // const coercionFn = Object.getPrototypeOf(this).coercions[coercion];
    const coercionFn =
      Object.getPrototypeOf(this).constructor.coercions[coercion];

    if (!coercionFn) {
      throw new Error(`Cannot coerce '${this.contractName}' into coercion`);
    }

    Object.defineProperty(this, "coercion", {
      value: coercionFn.bind(this),
      enumerable: false,
      writable: true,
    });
    return this;
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
  /**
   *
   */
  async run(): Promise<Output> {
    throw new Error(
      `MutationType '${this.contractName}' does not have a mutation method`,
    );
  }

  /**
   * Ensure that mutation contracts do not serialize automatically
   */
  toJSON() {
    return this;
  }
}
