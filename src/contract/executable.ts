import * as constants from "./constants.js";
import { EventEmitter } from "node:events";

/**
 */
export default class Executable implements ExecutableInterface {
  /**
   * The executable does not have a result to return, but it expects to
   */
  static readonly Pending: unique symbol = Symbol("pending");
  /**
   * The executable does not have a result to return, and as long as conditions
   * do not change, it may be considered complete
   */
  static readonly Done: unique symbol = Symbol("done");
  /**
   * Unique identifier for this executable
   */
  declare id: string;
  /**
   * Executables that this executable depends on
   */
  declare dependencies: Dependencies;
  /**
   * Executables that depend on this
   */
  declare dependents: Dependencies;
  /**
   * A reference to an object that should be used as the evaluation scope
   * for this executable
   */
  declare __evaluations: Evaluations;
  declare __executables: ExecutableParents;
  declare __errors: Record<string, Array<Error | HttpError>>;

  declare __input?: unknown;
  declare __context?: PluginContext;
  declare __executionScope?: Executable;
  declare __promise?: Promise<unknown>;

  declare key?: string;
  declare index?: number;
  declare parent: ExecutableParent;
  declare sync: boolean;

  /**
   * Executables return a complete result that is intended for consumption according to
   * the contract type defition. Otherwise, they return a unique symbol indicating that
   * they do not (or do not yet) have an accessible result
   */
  get result(): unknown | typeof Executable.Pending | typeof Executable.Done {
    return Executable.Done;
  }

  /**
   * By default, returns true if all dependencies are finalized
   */
  get finalized(): boolean {
    const isFinalized = Object.values(this.dependencies)
      .filter((dependency) => dependency.sync)
      .every((dependency) => dependency.finalized);
    return isFinalized;
  }

  get incompleteDependencies() {
    return Object.values(this.dependencies).filter((dependency) => {
      return !dependency.finalized;
    });
  }

  constructor(args: ExecutableArgs<unknown[]>) {
    const { parent, index, key, id, sync = true, scope } = args;

    Object.defineProperty(this, "id", {
      value: id,
      enumerable: false,
      writable: false,
      configurable: true,
    });

    Object.defineProperty(this, "index", {
      value: index,
      enumerable: false,
      writable: false,
      configurable: true,
    });

    Object.defineProperty(this, "key", {
      value: key,
      enumerable: false,
      writable: false,
      configurable: true,
    });

    Object.defineProperty(this, "parent", {
      value: parent,
      enumerable: false,
      writable: false,
      configurable: true,
    });

    Object.defineProperty(this, "dependencies", {
      value: {},
      enumerable: false,
      writable: false,
      configurable: true,
    });

    Object.defineProperty(this, "dependents", {
      value: {},
      enumerable: false,
      writable: false,
      configurable: true,
    });

    Object.defineProperty(this, "sync", {
      value: sync,
      enumerable: false,
      writable: false,
      configurable: true,
    });

    Object.defineProperty(this, "__evaluations", {
      value: scope?.evaluations || {},
      enumerable: false,
      writable: false,
      configurable: true,
    });

    Object.defineProperty(this, "__executables", {
      value: scope?.executables || {},
      enumerable: false,
      writable: false,
      configurable: true,
    });

    Object.defineProperty(this, "__errors", {
      value: scope?.errors || {},
      enumerable: false,
      writable: false,
      configurable: true,
    });
  }

  /**
   * By default, executables return the exact references evaluations object
   * received during construction. Other forms of executables may choose
   * to modify the returned object to preserve proper scope
   *
   * TODO: evaluations should make the current scope key unavailable, or
   * in the case of an index of an array, the current scope key and index
   * should be omitted from the results
   */
  get evaluations() {
    // return this.__evaluations;
    return new Proxy<Evaluations>(this.__evaluations, {
      get: (_, prop) => {
        const instance = this.__evaluations[prop as keyof Evaluations];

        if (prop === this.key) {
          const index = this.index;

          if (Array.isArray(instance) && index != null) {
            return Array.from(instance, (v, i) =>
              i !== index ? v : undefined,
            );
          }
        } else {
          return instance;
        }
      },
      set: (target, prop, value) => {
        this.__evaluations[prop as keyof Evaluations] = value;
        return true;
      },
    });
  }

  get executables() {
    return new Proxy<ExecutableParents>(this.__executables, {
      get: (_, prop) => {
        const executableParent =
          this.__executables[prop as keyof ExecutableParents];

        if (prop === this.key) {
          const index = this.index;

          if (Array.isArray(executableParent) && index != null) {
            return Array.from(executableParent, (v, i) =>
              i !== index ? v : undefined,
            );
          }
        } else {
          return executableParent;
        }
      },
      set: (target, prop, value) => {
        this.__executables[prop as keyof ExecutableParents] = value;
        return true;
      },
    });
  }

  get errors() {
    return this.__errors;
  }

  get executionName(): string {
    return "Generic";
  }

  /**
   * Executables may implement synchronous input steps to detect immediate
   * dependencies and populate evaluations. By default, all executables will
   * mark itself as a dependency for the current `self` in the execution context
   */
  input(
    pluginContext: PluginContext,
    input: unknown,
    executionScope?: Executable,
  ) {
    Object.defineProperty(this, "__context", {
      value: pluginContext,
      enumerable: false,
      writable: true,
    });
    Object.defineProperty(this, "__executionScope", {
      value: executionScope,
      enumerable: false,
      writable: true,
    });
    Object.defineProperty(this, "__input", {
      value: input,
      enumerable: false,
      writable: true,
    });
    /**
     * Establish a dependency between this executable and its parent
     * UNLESS it's an async dependency
     */
    if (executionScope) {
      this.dependents[executionScope.id] = executionScope;
      executionScope.dependencies[this.id] = this;
    }

    return this;
  }

  /**
   * Register an error or multiple errors to the execution context for this member
   */
  error(message: Error | HttpError | Array<Error | HttpError> | false) {
    const selfErrors = (this.errors[this.id] = this.errors[this.id] || []);
    if (Array.isArray(message)) {
      selfErrors.push(...message);
    } else if (message) {
      selfErrors.push(message);
    } else {
      delete this.errors[this.id];
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
   *
   */
  async execute(
    pluginContext: PluginContext,
    input: unknown,
    scope?: Executable,
  ): Promise<unknown> {
    while (
      this.incompleteDependencies.filter((dependency) => dependency.sync).length
    ) {
      await Promise.all(
        this.incompleteDependencies.map(async (dependency) => {
          const dependencyExecution = dependency.execute(
            pluginContext,
            input,
            scope,
          );

          if (dependency.sync) {
            return dependencyExecution;
          } else {
            dependencyExecution.catch((error) => {
              /* noop */
            });
          }
        }),
      );
    }

    return this;
  }

  /**
   * When JSONifying an executable, get the last non-promise result
   */
  toJSON(): Exclude<
    Executable["result"],
    typeof Executable.Pending | typeof Executable.Done
  > {
    const { result } = this;

    if ([Executable.Pending, Executable.Done].includes(result as symbol)) {
      return null;
    }

    return result;
  }

  [Symbol.toPrimitive](hint) {
    const result = this.toJSON();
    if (hint === "number" && typeof result !== "number") {
      return null;
    }

    if (hint === "string" && typeof result !== "string") {
      return String(result);
    }

    return result;
  }
}
