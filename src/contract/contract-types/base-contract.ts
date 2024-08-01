/* eslint-disable @typescript-eslint/no-unused-vars */
import { SideEffect } from "@earnest/state-machine";

enum Phase {
  Initial, // Raw Template, Pre-Transformation
  Definition, // Raw Template, Pre-Transformation
  Transformed, // Post-Transformation, Pre-Evaluation
  Evaluating, // Evaluation started, LOCKED
  Evaluated, // Evaluation finished, LOCKED
}

/**
 * Each ContractType class describes a different type of contract that can be executed
 */
export default abstract class ContractType<
  Definition,
  Transformation = Definition,
  Evaluation = void,
> {
  id: string;

  get contractName(): string {
    return "Contract";
  }

  static Phase = Phase;

  contract: ConstructorArguments["contract"];

  __results: [Definition?, Transformation?, Promise<Evaluation>?, Evaluation?];

  get phase(): Phase {
    if (this.results.length >= 4) {
      return Phase.Evaluated;
    }

    if (this.results.length >= 3) {
      return Phase.Evaluating;
    }

    if (this.results.length >= 2) {
      return Phase.Transformed;
    }

    if (this.results.length >= 1) {
      return Phase.Definition;
    }

    return Phase.Initial;
  }

  get isLocked() {
    return this.phase >= Phase.Evaluating;
  }

  /**
   * Return true if a contract instance is finished executing
   */
  isIncomplete(input: Input, context: Injections): boolean {
    if (
      this.phase === Phase.Transformed &&
      this.results[1] &&
      this.condition &&
      this.condition(input, context, this.results[1])
    ) {
      return true;
    }

    if (this.phase === Phase.Evaluating) {
      return true;
    }

    if (this.phase === Phase.Initial) {
      return true;
    }

    return false;
  }

  /**
   */
  get(...args: string[]) {
    return args.reduce((cursor, key) => cursor?.[key], this.result);
  }

  /**
   * With a fully qualified
   * By default, no transformation is performed, and the definition is used as-is
   */
  transform(context: Injections, definition: Definition): Transformation {
    return definition as unknown as Transformation;
  }

  /**
   * Optional conditional to control when a transformed contract may be evaluated
   */
  condition(
    input: Input,
    context: Injections,
    transformation: Transformation,
  ): boolean {
    return false;
  }

  /**
   * An optional evaluation step
   */
  evaluate?: (
    input: Input,
    context: Injections,
    transformation: Transformation,
  ) => Promise<Evaluation>;

  /**
   * Contracts that appear in this contract's output
   */
  dependencies: Dependencies = {};

  /**
   * Contracts that contain this contract in their output
   */
  dependents: Dependencies = {};

  constructor(args: ConstructorArguments) {
    const { id, contract } = args;

    Object.defineProperty(this, "id", {
      value: id,
      enumerable: false,
      writable: false,
    });

    Object.defineProperty(this, "contract", {
      value: contract,
      enumerable: false,
      writable: false,
    });

    this.results = [];
  }

  get results() {
    return this.__results;
  }

  get result(): Definition | Transformation | Evaluation {
    const nonPromiseResults = this.results.filter(
      (result) => !(result instanceof Promise),
    ) as Array<Definition | Transformation | Evaluation>;
    return nonPromiseResults[nonPromiseResults.length - 1];
  }

  set results(value) {
    Object.defineProperty(this, "__results", {
      value,
      enumerable: false,
      writable: true,
    });
  }
  error(input: Input, message: string | Array<string>) {
    if (!input.error) input.error = [];

    if (Array.isArray(message)) {
      input.error = input.error.concat(message);
    } else {
      input.error.push(message);
    }
  }
  /**
   * Use the execution context to
   */
  async execute(input: Input, injections: Injections) {
    // If the contract is already locked down, return it as-is;
    if (this.phase >= Phase.Evaluating) {
      await this.results[2];
      return this;
    }

    // if this contract has never executed, it should evaluate the template to
    // find direct dependencies for the first time. This first render is ignored
    // so that the dependencies can be executed first
    if (!this.results[0]) {
      this.contract.template(input, {
        data: { ...injections, contract: this },
      });
    }

    do {
      // dependencies are executed first so that the render method can
      // sufficiently replace the most up-to-date
      const incompleteDependencies = Object.values(this.dependencies).filter(
        (dependency) => dependency.isIncomplete(input, injections),
      );

      await Promise.all(
        incompleteDependencies.map(async (dependency) => {
          await dependency.execute(input, injections);
        }),
      );

      // once dependencies have been evaluated fully, the definition for this
      // contract is rendered. This JSON shape will be the input for the
      // transformation step
      const definition = this.contract.template(input, {
        data: { ...injections, contract: this },
      });

      this.results[0] = definition as unknown as Definition;

      // The transformation step produces the final JSON for normal contracts,
      // or the input for async contracts
      const transformation = this.transform(injections, this.results[0]);
      this.results[1] = transformation;

      // Contracts with an async component only run once when their conditions
      // are met. As soon as a contract has its condition met, it will begin
      // async evaluation and will no longer be triggered or re-evaluated
      if (
        this.results[1] !== undefined &&
        this.evaluate &&
        this.condition(input, injections, this.results[1])
      ) {
        const promise =
          this.results[2] ?? this.evaluate(input, injections, this.results[1]);
        this.results[2] = promise;
        this.results[3] = await promise;

        this.contract.template(input, {
          data: { ...injections, contract: this },
        });

        await Promise.all(
          Object.values(this.dependents).map(async (dependent) => {
            await dependent.execute(input, injections);
          }),
        );
      }
    } while (
      Object.values(this.dependencies).some((dependency) =>
        dependency.isIncomplete(input, injections),
      )
    );

    return this;
  }

  /**
   * Serialize the contracts by returning the most accomplished evaluation
   */
  toJSON(): unknown {
    return this.result;
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
  Skipped,
}
