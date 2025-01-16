import Manifest from "./manifest.js";
import Contract from "./contract.js";
import Executable from "./executable.js";
import { REFERENCE_ACCESS_PROPERTIES } from "./constants.js";

/**
 *
 */
class Scope<U extends object> {
  static EMPTY_TARGET = {};

  static propToIndex(
    key: string,
    prop: string,
    scope: Executable,
  ): number | void {
    if (typeof prop === "symbol") return;

    const index = !Number.isNaN(Number.parseInt(prop as string))
      ? Number.parseInt(prop as string)
      : undefined;

    const evaluations = scope.evaluations[key];

    if (
      prop === REFERENCE_ACCESS_PROPERTIES.LAST &&
      Array.isArray(evaluations)
    ) {
      return evaluations.length - 1;
    }

    const currentIndex = Array.isArray(evaluations)
      ? evaluations.findIndex((evaluation) => evaluation === undefined)
      : -1;

    if (!(index && index >= 0) && currentIndex >= 0) {
      if (prop === REFERENCE_ACCESS_PROPERTIES.NEXT) {
        return currentIndex + 1;
      }

      if (prop === REFERENCE_ACCESS_PROPERTIES.PREVIOUS) {
        return currentIndex - 1;
      }

      if (index && index < 0) {
        return currentIndex + index;
      }
    }

    return index;
  }

  /**
   * Determine the correct scope given the reference keys and index
   */
  static getTarget<U>(
    scope: Executable,
    key?: string,
    idx?: number,
  ): Executable | Executable[] | void {
    if (key) {
      const instance = scope.evaluations[key];

      if (idx != null && Array.isArray(instance)) {
        return instance[idx];
      }

      return instance;
    }
  }

  constructor(
    context: PluginContext,
    inherited: U,
    scope: Executable,
    /**
     * If a scope has been furnished with a key, use that to proxy evaluation arrays
     */
    key?: string,
    idx?: number,
  ) {
    const proxyTarget = Scope.getTarget(scope, key, idx) || Scope.EMPTY_TARGET;

    return new Proxy<Executable | Executable[] | typeof Scope.EMPTY_TARGET>(
      proxyTarget || Scope.EMPTY_TARGET,
      {
        /**
         * TODO [1/?]: Allow scope access to check for contract references and
         * trigger them as dependencies
         *   1. evaluations: contracts that have already been started
         *   2. executables: parents that can generate new evaluations
         */
        get(target, prop) {
          /**
           * acting in the scope of an array
           */
          if (Array.isArray(target) && key) {
            if (typeof target[prop] === "function") {
              return Reflect.get(target, prop);
            }

            /* ============================== *
             * TODO: we can add any arbitrary property traps to any contract references
             * that appear as an array that might make specifying dynamic dependencies
             * easier and more reliable. Currently supported:
             *
             * Contracts may refer to their neighboring contracts through reference
             * with these properties:
             *   @previous: refer to the immediately preceding contract if the
             *     current scope is part of that key's array
             *   @next: refer to the immediately proceeding contract if the
             *     current scope is part of that key's array
             * ============================== */

            const index = Scope.propToIndex(key, prop as string, scope);

            if (index != null) {
              const instance = target[index];
              if (!instance) return;
              if (!(instance.id in scope.dependencies)) {
                instance.input(context, inherited, scope);
              }
              const scopedInstance = new Scope(
                context,
                inherited,
                scope,
                key,
                index,
              );

              // return instance.toJSON();
              return scopedInstance;
            }

            if (
              typeof target[prop] === "function" ||
              Object.prototype.hasOwnProperty.call(target, prop)
            ) {
              return Reflect.get(target, prop);
            }

            const allResults = target.map((t) => {
              if (!(t.id in scope.dependencies)) {
                t.input(context, inherited, scope);
              }
              return t.toJSON();
            });

            /* ============================== *
             * JSON.stringify will try to call toJSON on arrays first, and if
             * it fails, than a number of more restrictive internal methods
             * are called to make sure the array matches the ownProperties
             * of the proxy target, which causes a number of problems
             *
             * TODO: This does feel hacky; investigate some way of allowing this
             * trap to return all of the evaluations
             * ============================== */

            if (prop === "toJSON") {
              return () => allResults;
            }

            return Reflect.get(allResults, prop);
          }

          if (target instanceof Executable) {
            if (!(target.id in scope.dependencies)) {
              target.input(context, inherited, scope);
            }

            if (prop === "valueOf" || prop === Symbol.toPrimitive) {
              return Reflect.get(target, prop);
            }

            /* ============================== *
             * TODO: if we restore accessors for individual evaluations, we can
             * define custom accessor properties here
             * ============================== */
            if (prop === "toJSON") {
              return () => target.toJSON();
            }

            if (prop === REFERENCE_ACCESS_PROPERTIES.ID) {
              return target.id;
            }

            if (prop === REFERENCE_ACCESS_PROPERTIES.INDEX) {
              return target.index;
            }

            if (prop === REFERENCE_ACCESS_PROPERTIES.ERROR) {
              return scope.errors[target.id];
            }

            const jsonified = target.toJSON() as object;

            /* ============================== *
             * If the Handlebars internals tries to access an internal method
             * of the target executables result, make sure to bind that method
             * to the result
             * ============================== */
            if (typeof jsonified?.[prop] === "function") {
              return jsonified[prop].bind(jsonified);
            }

            return jsonified?.[prop];
          }

          const pseudoTarget = scope.evaluations[prop as string];

          if (pseudoTarget instanceof Executable) {
            if (!(pseudoTarget.id in scope.dependencies)) {
              pseudoTarget.input(context, inherited, scope);
            }

            /* ============================== *
             * TODO: to scope or not to scope?
             * ============================== */

            // return pseudoTarget.toJSON();
            return new Scope(context, inherited, scope, prop as string);
          } else if (Array.isArray(pseudoTarget)) {
            return new Scope(context, inherited, scope, prop as string);
          }
        },

        /**
         * This allows the scope object to fool handlebars into allowing these
         * dynamic references to be accessed as any other object
         */
        getOwnPropertyDescriptor(target, prop) {
          if (target instanceof Executable) {
            /**
             * Special reference properties
             */
            if (
              Object.values(REFERENCE_ACCESS_PROPERTIES).includes(
                prop as string,
              )
            ) {
              return { configurable: true, enumerable: true, writable: false };
            }

            const result = target.toJSON();

            if (result && typeof result === "object") {
              return Reflect.getOwnPropertyDescriptor(result, prop);
            }
          }

          /* ============================== *
           * For target arrays, ensure that we surface property descriptors for
           * the array itself
           * ============================== */

          if (
            Array.isArray(target) &&
            Array.prototype.hasOwnProperty.call(target, prop)
          ) {
            return Reflect.getOwnPropertyDescriptor(target, prop);
          }

          return { configurable: true, enumerable: true, writable: false };
        },
        ownKeys(target) {
          if (target instanceof Executable) {
            const result = target.result;

            if (result && typeof result === "object") {
              return Reflect.ownKeys(result);
            }
          }

          return Reflect.ownKeys(target);
        },
      },
    );
  }
}

export default Scope;
