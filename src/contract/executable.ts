/**
 * Anything that can be executed should do so with a consistent interface
 */
export default class Executable<Input> implements ExecutableInterface<Input> {
  /**
   * Executables that this executable depends on
   */
  declare dependencies: Dependencies<Input>;
  /**
   * Executables that depend on this
   */
  declare dependents: Dependencies<Input>;
  /**
   * Unique identifier for this executable
   */
  declare id: string;
  /**
   * A reference to an object that should be used as the evaluation scope
   * for this executable
   */
  declare __evaluations: Evaluations<Input>;

  /**
   * By default, executables return the exact references evaluations object
   * received during construction. Other forms of executables may choose
   * to modify the returned object to preserve proper scope
   */
  get evaluations() {
    return this.__evaluations;
  }

  get executionName(): string {
    return "Generic";
  }

  /**
   *
   */
  declare index?: number;
  declare parent: ExecutableParent<Input>;
  declare results: unknown[];

  constructor(args: ExecutableArgs<Input, unknown[]>) {
    const {
      parent,
      index,
      id,
      evaluations,
      results = [],
      dependencies = {},
      dependents = {},
    } = args;

    Object.defineProperty(this, "id", {
      value: id,
      enumerable: false,
      writable: false,
    });

    Object.defineProperty(this, "index", {
      value: index,
      enumerable: false,
      writable: false,
    });

    Object.defineProperty(this, "parent", {
      value: parent,
      enumerable: false,
      writable: false,
    });

    Object.defineProperty(this, "results", {
      value: results,
      enumerable: false,
      writable: false,
    });

    Object.defineProperty(this, "dependencies", {
      value: dependencies,
      enumerable: false,
      writable: false,
    });

    Object.defineProperty(this, "dependents", {
      value: dependents,
      enumerable: false,
      writable: false,
    });

    Object.defineProperty(this, "__evaluations", {
      value: evaluations,
      enumerable: false,
      writable: false,
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

  /**
   *
   * By default, only
   */
  isIncomplete(
    pluginContext: PluginContext,
    executionContext: ExecutionContext<Input>,
    input: Input,
  ): boolean {
    const incompleteDependencies = Object.values(this.dependencies).some(
      (dependency) =>
        dependency.isIncomplete(pluginContext, executionContext, input),
    );
    const incompleteResult =
      this.results[this.results.length - 1] instanceof Promise;

    return incompleteDependencies || incompleteResult;
  }

  /**
   * Executables may implement synchronous input steps to detect immediate
   * dependencies and populate evaluations. By default, all executables will
   * mark itself as a dependency for the current `self` in the execution context
   */
  input(
    pluginContext: PluginContext,
    executionContext: ExecutionContext<Input>,
    input: Input,
  ) {
    const { self, evaluations = {} } = executionContext;

    if (self) {
      this.dependents[self.parent.id] = self;
      self.dependencies[this.parent.id] = this;
    }
    return this;
  }

  /**
   *
   */
  async execute(
    pluginContext: PluginContext,
    executionContext: ExecutionContext<Input>,
    input: Input,
  ) {
    const incompleteDependencies = Object.values(this.dependencies).filter(
      (dependency) =>
        dependency.isIncomplete(pluginContext, executionContext, input),
    );

    await Promise.all(
      incompleteDependencies.map(async (dependency) => {
        await dependency.execute(pluginContext, executionContext, input);
      }),
    );

    return this;
  }

  /**
   * Register an error or multiple errors to the execution context for this member
   */
  error(
    executionContext: ExecutionContext<unknown>,
    message: Error | HttpError | Array<Error | HttpError>,
  ) {
    const errors = (executionContext.errors = executionContext.errors || {});

    const selfErrors = (errors[this.id] = errors[this.id] || []);
    if (Array.isArray(message)) {
      selfErrors.concat(message);
    } else {
      selfErrors.push(message);
    }
  }

  /**
   * TODO: extract this function so Client logging can inherit from it
   */
  private logLevelFromMessage(message: LogMessage): string {
    if (message.level) return message.level;
    if ("error" in message) return "error";
    if (
      (typeof message.statusCode === "number" && message.statusCode >= 500) ||
      message.statusCode === null
    )
      return "error";
    if (typeof message.statusCode === "number" && message.statusCode >= 400)
      return "warn";

    return "info";
  }

  log(context: PluginContext, message: LogMessage) {
    const level = this.logLevelFromMessage(message);
    const { error, ...rest } = message;
    const decoratedMessage = {
      error: error ? error.message : undefined,
      stack: error ? error.stack : undefined,
      ...rest,
      executable: {
        parent: this.parent.id,
        type: this.executionName,
        id: this.id,
      },
    };
    context?.logger?.log(level, decoratedMessage);
  }

  /**
   * When JSONifying an executable, get the last non-promise result
   */
  toJSON(): unknown {
    return this.result;
  }
}
