/* eslint-disable @typescript-eslint/no-unused-vars */
import Executable from "./executable.js";

import { DEFAULT_OPTIONS } from "./handlebars.js";

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
export default abstract class ContractExecutable<
  Definition,
  Transformation = Definition,
  Evaluation = void,
> extends Executable<unknown> {
  get executionName(): string {
    return "Contract";
  }

  static Phase = Phase;

  declare parent: Contract<unknown>;

  declare results: [
    Definition?,
    Transformation?,
    Promise<Evaluation>?,
    Evaluation?,
  ];

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
  isIncomplete(
    pluginContext: Context,
    executionContext: ExecutionContext<unknown>,
    input: Input<unknown>,
  ): boolean {
    if (
      this.phase === Phase.Transformed &&
      this.results[1] &&
      this.condition &&
      this.condition(pluginContext, executionContext, input, this.results[1])
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
   * Use the parent contract's template to generate the JSON defintion
   */
  render(
    pluginContext: Context,
    executionContext: ExecutionContext<unknown>,
    input: Input<unknown>,
  ): Definition | void {
    const index = this.index ?? executionContext.index;

    try {
      const definition = this.parent.template(input, {
        data: {
          context: pluginContext,
          ...executionContext,
          index,
          self: this,
        },
        ...DEFAULT_OPTIONS,
      }) as unknown as Definition;

      return definition;
    } catch (error) {
      this.log(pluginContext, {
        message: this.id,
        error,
      });

      this.error(executionContext, new Error("Contract failed to render"));
    }
  }

  /**
   */
  input(
    pluginContext: Context,
    executionContext: ExecutionContext<unknown>,
    input: Input<unknown>,
  ) {
    super.input(pluginContext, executionContext, input);

    /* ============================== *
     * The parent template is run once to check for contract references and
     * set appropriate top-level dependencies. Additional dependencies may
     * become exposed as inner contracts are executed and re-transformed
     * ============================== */

    this.render(pluginContext, executionContext, input);

    return this;
  }

  /**
   * With a fully qualified
   * By default, no transformation is performed, and the definition is used as-is
   */
  transform(
    pluginContext: Context,
    executionContext: ExecutionContext<unknown>,
    definition: Definition,
  ): Transformation {
    return definition as unknown as Transformation;
  }

  /**
   * Optional conditional to control when a transformed contract may be evaluated
   */
  condition(
    pluginContext: Context,
    executionContext: ExecutionContext<unknown>,
    input: Input<unknown>,
    transformation: Transformation,
  ): boolean {
    return false;
  }

  /**
   * An optional evaluation step
   */
  evaluate?: (
    pluginContext: Context,
    executionContext: ExecutionContext<unknown>,
    input: Input<unknown>,
    transformation: Transformation,
  ) => Promise<Evaluation>;

  /**
   * Use the execution context to
   */
  async execute<I>(
    pluginContext: Context,
    executionContext: ExecutionContext<I>,
    input: Input<I>,
  ) {
    // If the contract is already locked down, return it as-is;
    if (this.phase >= Phase.Evaluating) {
      await this.results[2];
      return this;
    }

    const index = this.index ?? executionContext.index;
    const subExecutionContext = { ...executionContext, index, self: this };

    do {
      /**
       * Check for incomplete dependencies
       * using the inhereted Executable behavior
       */
      await super.execute(pluginContext, subExecutionContext, input);

      /**
       * once dependencies have been evaluated fully, the definition for this
       * contract is rendered. This JSON shape will be the input for the
       * transformation step
       */
      const definition = this.render(pluginContext, subExecutionContext, input);

      this.results[0] = definition as unknown as Definition;

      // The transformation step produces the final JSON for normal contracts,
      // or the input for async contracts
      const transformation = this.transform(
        pluginContext,
        subExecutionContext,
        this.results[0],
      );
      this.results[1] = transformation;

      // Contracts with an async component only run once when their conditions
      // are met. As soon as a contract has its condition met, it will begin
      // async evaluation and will no longer be triggered or re-evaluated
      if (
        this.results[1] !== undefined &&
        this.evaluate &&
        this.condition(
          pluginContext,
          subExecutionContext,
          input,
          this.results[1],
        )
      ) {
        const promise =
          this.results[2] ??
          this.evaluate(
            pluginContext,
            subExecutionContext,
            input,
            this.results[1],
          );
        this.results[2] = promise;
        this.results[3] = await promise;

        /**
         * Is this necessary?
         */
        this.render(pluginContext, subExecutionContext, input);

        await Promise.all(
          Object.values(this.dependents).map(async (dependent) => {
            await dependent.execute(pluginContext, subExecutionContext, input);
          }),
        );
      }
    } while (
      Object.values(this.dependencies).some((dependency) =>
        dependency.isIncomplete(pluginContext, subExecutionContext, input),
      )
    );

    return this;
  }

  [Symbol.toStringTag]() {
    return this.executionName;
  }
}

export enum Status {
  Dormant,
  Pending,
  Executing,
  Done,
  Skipped,
}
