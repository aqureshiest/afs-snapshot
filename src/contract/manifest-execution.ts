import Manifest from "./manifest.js";
import Executable from "./executable.js";
import * as constants from "./constants.js";

export default class ManifestExecution extends Executable {
  declare parent: Manifest;

  declare __scopedEvaluations: Evaluations;
  declare __scopedExecutables: ExecutableParents;

  /**
   * Manifest evaluations will return the same evaluations reference it
   * was passed on creation as well as its own scoped evaluations object.
   *
   * Assigning new evaluations
   */
  get evaluations() {
    return new Proxy<Evaluations>(this.__scopedEvaluations, {
      get: (_, prop) => {
        const {
          __scopedExecutables: executables,
          __scopedEvaluations: evaluations,
          __context: context,
          __input: input,
          __executionScope: executionScope,
        } = this;

        // if this manifest has an uninstantiated executable,
        // instantiate it and add it to scoped evaluations
        if (!(prop in evaluations) && prop in executables) {
          const executable = executables[prop as string];

          if (Array.isArray(executable)) {
            const instances = executable.map((ex, i) =>
              ex.instantiate(this, prop, i),
            );

            evaluations[prop as keyof Evaluations] = instances;
            if (context && input) {
              instances
                .filter((instance) => !(instance.__context && instance.__input))
                .forEach((instance) => instance.input(context, input, this));
            }
          } else {
            const instance = executable.instantiate(this, prop as string);
            evaluations[prop as keyof Evaluations] = instance;
            if (context && input && !(instance.__input && instance.__context)) {
              instance.input(context, input, this);
            }
          }

          // evaluations[prop as keyof Evaluations];
          // if there is a parent executable already within this scope, do not extend outside of this scope
          // return this.__scopedEvaluations[prop as keyof Evaluations];
        }

        /**
         * If this manifest has an evaluation in scope, return it
         */
        if (prop in evaluations) {
          return evaluations[prop as keyof Evaluations];
        }

        // otherwise, default to default executable behavior
        return super.evaluations[prop as keyof Evaluations];
      },
      set: (target, prop, value) => {
        // TODO: how to safely access the parent executable scope if and only if
        // the value is recognized as belonging to a parent scope
        this.__scopedEvaluations[prop as keyof Evaluations] = value;
        return true;
      },
    });
  }

  get executables() {
    return new Proxy<ExecutableParents>(this.__scopedExecutables, {
      get: (_, prop) => {
        if (prop in this.__scopedExecutables) {
          return this.__scopedExecutables[prop as keyof ExecutableParents];
        }

        // Avoid recursive executables
        // if (prop !== this.key) {
        return super.executables[prop as keyof ExecutableParents];
        //}
      },
      set: (target, prop, value) => {
        this.__scopedExecutables[prop as keyof ExecutableParents] = value;
        return true;
      },
    });
  }

  get result() {
    const { evaluations } = this;

    const evaluation =
      evaluations[constants.RESERVED_CONTRACT_KEYS[constants.SYNC_CONTRACT]];

    return Array.isArray(evaluation)
      ? evaluation.map((e) => e.toJSON())
      : evaluation.toJSON();
  }

  get finalized() {
    const { evaluations } = this;
    const evaluation =
      evaluations[constants.RESERVED_CONTRACT_KEYS[constants.SYNC_CONTRACT]];

    const isFinalized = Array.isArray(evaluation)
      ? evaluation.every((evaluation) => evaluation.finalized)
      : evaluation.finalized;

    return isFinalized;
  }

  get executionName(): string {
    return "Manifest";
  }

  /**
   * ManifestExecution stores a reference to the inherited evaluations
   */
  constructor(args: ExecutableArgs<unknown[]>) {
    super(args);

    /* ============================== *
     * Manifest executions will create their own scope for evaluations
     * and executable parents, so that contracts inside can reach context
     * outside of the manfiest, but not the other way around
     * ============================== */

    Object.defineProperty(this, "__scopedEvaluations", {
      value: {},
      enumerable: false,
      writable: false,
      configurable: true,
    });

    const executables =
      args.parent instanceof Manifest ? args.parent.executables : {};

    Object.defineProperty(this, "__scopedExecutables", {
      value: executables,
      enumerable: false,
      writable: false,
      configurable: true,
    });
  }

  /**
   * ManifestExecution, in addition to linking itself to the execution context
   * `self` executable, will create an immediate link to the root contract or
   * contracts
   */
  input(pluginContext: PluginContext, input, scope?: Executable) {
    super.input(pluginContext, input, scope);

    [constants.SYNC_CONTRACT, constants.ASYNC_CONTRACT]
      .map((rootSymbol) => constants.RESERVED_CONTRACT_KEYS[rootSymbol])
      .filter(
        (rootKey) =>
          rootKey in this.__scopedExecutables &&
          !(rootKey in this.__scopedEvaluations),
      )
      .forEach((rootKey) => {
        const evaluation = this.evaluations[rootKey];

        if (Array.isArray(evaluation)) {
          evaluation
            .filter(Boolean)
            .forEach((instance) => instance.input(pluginContext, input, this));
        } else if (evaluation) {
          evaluation.input(pluginContext, input, this);
        }
      });

    return this;
  }

  /**
   * Executing a manifest
   */
  execute(pluginContext: PluginContext, input, scope?: Executable) {
    if (this.__promise) {
      return this.__promise;
    }

    const asyncOperation =
      this.__scopedEvaluations[
        constants.RESERVED_CONTRACT_KEYS[constants.ASYNC_CONTRACT]
      ];

    if (asyncOperation) {
      if (Array.isArray(asyncOperation)) {
        Promise.all(
          asyncOperation.map((operation) =>
            operation.execute(pluginContext, input, this).catch((error) => {
              /* noop */
            }),
          ),
        );
      } else {
        asyncOperation.execute(pluginContext, input, this).catch((error) => {
          /* noop */
        });
      }
    }

    this.__promise = super.execute(pluginContext, input, this);

    return this.__promise;
  }

  toJSON(): unknown {
    return this.result;
  }
}
