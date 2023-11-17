import assert from "node:assert";

/* eslint-disable @typescript-eslint/no-unused-vars */
const postHandler: Handler = async function (context, req, res, next) {
  const contract = res.locals.contract;
  const mutations = res.locals.mutations;

  if (mutations.length === 0) {
    return res.send(contract);
  }

  const effects = context.loadedPlugins.mutations.instance;
  assert(effects, "[182902b4] side-effect machine not present");

  /* ============================== *
   * TODO: complex mutations may need to go through an entirely separate
   * side-effect orchestration layer
   * ============================== */

  const results = await effects.run({ context, mutations });

  return res.send(contract);
};

export default postHandler;
