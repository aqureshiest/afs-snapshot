/* eslint-disable @typescript-eslint/no-unused-vars */
import assert from "node:assert";
import Contract from "../contract.js";
import * as constants from "../constants.js";

const contractHelper: TemplateHelper = function (...args) {
  const rawKey: string =
    typeof args[0] === "string" ? args[0] : args[0].hash.key;
  const index =
    typeof args[1] === "number" ? args[1] : (undefined as number | undefined);

  if (rawKey in constants.RESERVED_CONTRACT_KEYS) {
    throw new Error(`Invalid use of reserved contract key: '${rawKey}'`);
  }

  // handlebars template helpers always add the options argument as the last argument, but
  // we need to tell the type system that the length is always 3 in order to get the right
  // type from the tuple index and–– Listen, I'm not happy about it either. Just go with it.
  const options = args[(args.length - 1) as 3] as HelperOptions;

  const key = rawKey || `${options.loc.start.line}:${options.loc.start.column}`;

  const { context, self, ref } = options.data;

  assert(self);

  if ("fn" in options) {
    // TODO: the raw contract body may change between renders;
    // we should probably figure out a way to replace dynamic contracts
    // that have already been marked as a dependency by another
    if (self.evaluations[key]) {
      return JSON.stringify(ref[rawKey]);
    }

    /* ============================== *
     * TODO [1/4]: embedded contracts using the block form of the contract template
     * helper should allow for a distinct frame with custom variables to be passed
     *
     * Read: https://handlebarsjs.com/api-reference/utilities.html#handlebars-createframe-data
     * ============================== */

    const definition = options.fn(this, options);

    /* ============================== *
     * TODO [2/4]: unless the definition is returned raw (as-is), it is going
     * to be rendered by the containing contract before passing it as a definition
     * to this contract, which inverts the typical rendering order
     *
     * Consider approaches that make dynamic contracts more consistent with
     * pre-defined contracts
     * ============================== */

    const parent = new Contract({
      type: options.hash.type,
      raw: definition,
      key: self.id + `(${key})`,
    });

    const instance = parent.instantiate(self, key);

    Object.values(self.dependencies).forEach((dep) => {
      if (dep.id !== instance.id) {
        // TODO: making all these logs dependent on the self contract actually breaks some shit
        instance.dependencies[dep.id] = dep;
      }
    });

    self.evaluations[key] = instance;

    instance.input(context, options.data.root, self);
  }

  /* ============================== *
   * TODO [3/4]: When making a direct reference to a contract using the
   * template-helper, we may have the option to
   * ------------------------------ *
   * TODO [4/4]: maybe it should be possible to use contracts as partials, with
   * inner content passed through it?
   * ============================== */

  const value = ref[key];

  if (value && index != null) {
    return value[index];
  }

  if ("fn" in options) {
    return JSON.stringify(value);
  }

  return value;
};

export default contractHelper;
