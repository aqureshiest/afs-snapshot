/* eslint-disable @typescript-eslint/no-unused-vars */
import assert from "node:assert";

const contractHelper: TemplateHelper = function (...args) {
  const key: string = typeof args[0] === "string" ? args[0] : args[0].hash.key;
  const index =
    typeof args[1] === "number" ? args[1] : (undefined as number | undefined);

  // handlebars template helpers always add the options argument as the last argument, but
  // we need to tell the type system that the length is always 3 in order to get the right
  // type from the tuple index and–– Listen, I'm not happy about it either. Just go with it.
  const options = args[(args.length - 1) as 3];

  const { context, manifest, self } = options.data;
  assert(manifest, "[a9232983] missing manifest");

  assert(self);

  const { evaluations } = self;
  assert(evaluations, "[fd77f1ab] missing evaluations");

  /* ============================== *
   * 1. Check the Manifest in scope for the keyed executable matching the
   *    key and optional index (in the case of an array)
   * ============================== */

  const executableParent:
    | undefined
    | ExecutableParent<unknown>
    | ExecutableParent<unknown>[] =
    Array.isArray(manifest.executables[key]) && index !== undefined
      ? manifest.executables[key][index]
      : manifest.executables[key];

  /* ============================== *
   * 2. Check the evaluations for previously started or completed executables
   *    matching the key and optional index (in the case of an array)
   * ============================== */

  const executable: undefined | Executable<unknown> | Executable<unknown>[] =
    index !== undefined ? evaluations[key]?.[index] : evaluations[key];
  /**
   * Return the value for local executable parents or existing evaluation scope
   */
  const guaranteeExecutable = (
    inherited?: Executable<unknown>,
    parent?: ExecutableParent<unknown>,
    i?: number,
  ) => {
    /* ============================== *
     * 1. Create a new executable instance if there is a
     * ============================== */
    if (parent && (!inherited || inherited.parent.id !== parent.id)) {
      const newExecutable = parent.input(
        context,
        { key, index: i, manifest, evaluations, self },
        options.data.root,
      );

      if (i !== undefined) {
        if (!Array.isArray(evaluations[key])) evaluations[key] = [];
        evaluations[key][i] = newExecutable;
      } else {
        evaluations[key] = newExecutable;
      }

      return newExecutable.toJSON();
    }
    if (inherited) {
      self.dependencies[inherited.parent.id] = inherited;
      inherited.dependents[self.parent.id] = self;

      return inherited.toJSON();
    }
  };

  const contractValue = (() => {
    if (executableParent) {
      if (Array.isArray(executableParent)) {
        return executableParent.map((parent, i) => {
          const existing = Array.isArray(executable)
            ? executable[i]
            : undefined;
          return guaranteeExecutable(existing, parent, i);
        });
      } else {
        const existing = Array.isArray(executable) ? undefined : executable;
        return guaranteeExecutable(existing, executableParent);
      }
    } else if (executable) {
      return Array.isArray(executable)
        ? executable.map((inherited, i) =>
            guaranteeExecutable(inherited, undefined, i),
          )
        : guaranteeExecutable(executable);
    }
  })();

  if ("fn" in options) {
    return options.fn(contractValue ?? null, options);
  }

  return contractValue;
};

export default contractHelper;
