import assert from "node:assert";

/* eslint-disable @typescript-eslint/no-unused-vars */
const postHandler: Handler = async function (context, req, res, next) {
  const manifest = res.locals.manifest;
  const input = res.locals.inputs;
  const contract = res.locals.contract;
  const mutations = res.locals.mutations;

  if (Object.keys(mutations).length === 0) {
    return res.send(contract);
  }

  const machine = context.loadedPlugins.mutations.instance;

  assert(machine, "[182902b4] state machine not present");

  /* ============================== *
   * TODO: complex mutations may need to go through an entirely separate
   * side-effect orchestration layer
   * ============================== */
  const { value: a1 } = await machine.next({
    contract,
    context,
    mutations,
    manifest,
    input,
  });

  const { value: assertions } = await machine.next({ ...a1, asOf: new Date() });

  const { contract: response } = assertions;

  return res.send(response);
};

export default postHandler;
