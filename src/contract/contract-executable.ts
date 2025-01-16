/* eslint-disable @typescript-eslint/no-unused-vars */
import Executable from "./executable.js";
import Scope from "./scope.js";

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
> extends Executable {
  static Phase = Phase;

  declare parent: Contract<unknown>;
  declare scope: Scope<object>;

  /**
   * Contracts with an async component will skip rendering / transformation
   */
  declare __result: unknown;
  /**
   * Contracts with an async component lock themselves down as soon as the promise has started
   */
  declare __promise?: Promise<Evaluation>;

  get executionName(): string {
    return "Contract";
  }

  /**
   * When getting the result of a contract, it will cycle through the rendering and transformation
   * phases, unless it has already begun async evaluation
   *
   * TODO: make contract types have less rigid evaluation pipelines
   */
  get result() {
    if (this.__result !== undefined) {
      return this.__result;
    }
    if (this.__promise !== undefined) {
      return Executable.Pending;
    }

    const {
      __context: context,
      __input: input,
      __executionScope: executionScope,
    } = this;

    if (!context || !input) {
      return Executable.Pending;
    }

    const definition = this.render(context, input);

    const allDependenciesFinalized = super.finalized;

    if (definition == null) {
      if (allDependenciesFinalized) {
        this.__result = Executable.Done;
        return Executable.Done;
      }

      return Executable.Pending;
    }

    if (!allDependenciesFinalized) {
      return Executable.Pending;
    }

    const transformation = this.transform(context, definition, executionScope);

    if (!this.condition || !this.evaluate) {
      if (allDependenciesFinalized) {
        this.__result = transformation;
        return transformation;
      }

      return Executable.Pending;
    }

    // if all dependencies are finalized, and this contract passes itw own condition for evaluating,
    // then proceed past the point of no return
    const shouldExecute = this.condition(
      context,
      input,
      transformation,
      executionScope,
    );

    if (!shouldExecute) {
      if (allDependenciesFinalized) {
        this.__result = Executable.Done;
      }
      return Executable.Done;
    }

    if (!allDependenciesFinalized) {
      return Executable.Pending;
    }

    const promise = this.evaluate(
      context,
      input,
      transformation,
      executionScope,
    );

    this.__promise = promise.then((res) => {
      this.__result = res ?? Executable.Done;
      return res;
    });

    return Executable.Pending;
  }

  /**
   * A contract is finalized as long as all dependencies are finalized,
   */
  get finalized() {
    return super.finalized && this.__result !== undefined;
  }

  /**
   * Use the parent contract's template to generate the JSON defintion
   */
  render(
    pluginContext: Context,
    input: unknown,
    scope: Executable = this,
  ): Definition | void {
    const ref = (this.scope =
      this.scope ?? new Scope(pluginContext, input as object, scope));

    try {
      this.error(false);
      const definition = this.parent.template(input, {
        data: {
          context: pluginContext,
          index: this.index,
          scope,
          ref,
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

      this.error(new Error("Contract failed to render"));
    }
  }

  /**
   * Contracts do a bare-render on first input to map out additional dependencies,
   * then cache the context, input and executable scope for obtaining the result
   * through the result getter
   */
  input(pluginContext: Context, input: unknown, executionScope?: Executable) {
    super.input(pluginContext, input, executionScope);

    /* ============================== *
     * The parent template is run once to check for contract references and
     * set appropriate top-level dependencies. Additional dependencies may
     * become exposed as inner contracts are executed and re-transformed
     * ============================== */

    this.render(pluginContext, input, this);

    return this;
  }

  /**
   * With a fully qualified
   * By default, no transformation is performed, and the definition is used as-is
   */
  transform(
    pluginContext: Context,
    definition: Definition,
    scope?: Executable,
  ): Transformation {
    return definition as unknown as Transformation;
  }

  /**
   * Optional conditional to control when a transformed contract may be evaluated
   */
  condition(
    pluginContext: Context,
    input: unknown,
    transformation: Transformation,
    scope: Executable = this,
  ): boolean {
    return Boolean(this.evaluate && transformation);
  }

  /**
   * An optional evaluation step
   */
  evaluate?: (
    pluginContext: Context,
    input: unknown,
    transformation: Transformation,
    scope?: Executable,
  ) => Promise<Evaluation>;

  /**
   * Use the execution context to
   */
  execute(
    pluginContext: Context,
    input: unknown,
    executionScope: Executable = this,
  ): Promise<unknown> {
    if (this.__promise && !this.__result) {
      return this.__promise;
    }

    return super
      .execute(pluginContext, input, executionScope)
      .then(async (self: this) => {
        Reflect.get(self, "result");
        if (self.__promise && !self.__result) {
          await self.__promise;
        }

        return self;
      });
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
