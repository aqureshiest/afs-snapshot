import Manifest from "./manifest.js";
import Executable from "./executable.js";
import * as constants from "./constants.js";

export default class ManifestExecution<I> extends Executable<I> {
  declare parent: Manifest<I>;

  declare __scopedEvaluations: Evaluations<I>;

  declare results: Array<Executable<I> | Array<Executable<I>>>;

  /**
   * Manifest evaluations will return the same evaluations reference it
   * was passed on creation as well as its own scoped evaluations object.
   *
   * Assigning new evaluations
   */
  get evaluations() {
    return new Proxy<Evaluations<I>>(this.__scopedEvaluations, {
      get: (_, prop) => {
        return (
          this.__scopedEvaluations[prop as keyof Evaluations<I>] ??
          super.evaluations[prop as keyof Evaluations<I>]
        );
      },
      set: (target, prop, value) => {
        this.__scopedEvaluations[prop as keyof Evaluations<I>] = value;
        return true;
      },
    });
  }

  /**
   * the last non-promise
   */
  get result(): Exclude<this["results"][number], Promise<unknown>> {
    const nonPromiseResults = this.results.filter(
      (result) => !(result instanceof Promise),
    );
    return nonPromiseResults[nonPromiseResults.length - 1] as Exclude<
      this["results"][number],
      Promise<unknown>
    >;
  }

  get executionName(): string {
    return "Manifest";
  }

  /**
   * ManifestExecution stores a reference to the inherited evaluations
   */
  constructor(args: ExecutableArgs<I, unknown[]>) {
    super(args);

    Object.defineProperty(this, "__scopedEvaluations", {
      value: {},
      enumerable: false,
      writable: false,
    });
  }

  isIncomplete(pluginContext, executionContext, input) {
    const executable = this.results[0];

    if (!executable) return true;

    const executablesIncomplete = Array.isArray(executable)
      ? executable.every((ex) =>
          ex.isIncomplete(pluginContext, executionContext, input),
        )
      : executable.isIncomplete(pluginContext, executionContext, input);

    return executablesIncomplete;
  }

  /**
   * ManifestExecution, in addition to linking itself to the execution context
   * `self` executable, will create an immediate link to the root contract or
   * contracts
   */
  input(
    pluginContext: PluginContext,
    executionContext: ExecutionContext,
    input,
  ) {
    super.input(pluginContext, executionContext, input);

    const root = this.parent.executables[constants.ROOT_CONTRACT];

    if (Array.isArray(root)) {
      this.evaluations[constants.ROOT_CONTRACT] = root.map(
        (executableParent, index) =>
          executableParent.input(
            pluginContext,
            {
              ...executionContext,
              key: constants.ROOT_CONTRACT,
              index,
              manifest: this.parent,
              self: this,
              evaluations: this.evaluations,
            },
            input,
          ),
      );
    } else {
      // const index = this.index ?? executionContext.index;
      this.evaluations[constants.ROOT_CONTRACT] = root.input(
        pluginContext,
        {
          ...executionContext,
          key: constants.ROOT_CONTRACT,
          index: undefined,
          manifest: this.parent,
          self: this,
          evaluations: this.evaluations,
        },
        input,
      );
    }

    return this;
  }

  /**
   * Executing a manifest
   */
  async execute(
    pluginContext: PluginContext,
    executionContext: ExecutionContext,
    input,
  ) {
    if (this.results.length) return this;

    const index = this.index ?? executionContext.index;

    const subExecutionContext = {
      ...executionContext,
      index,
      manifest: this.parent,
      self: this,
      evaluations: this.evaluations,
    };

    /**
     * Check for incomplete dependencies
     * using the inhereted Executable behavior
     */
    await super.execute(pluginContext, subExecutionContext, input);
    this.results[0] = this.evaluations[constants.ROOT_CONTRACT];

    return this;
  }

  toJSON(): unknown {
    const result = this.result;

    return Array.isArray(result)
      ? result.map((res) => res?.toJSON())
      : result?.toJSON();
  }
}
