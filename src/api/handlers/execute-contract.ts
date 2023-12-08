import assert from "node:assert";

/**
 * Use the path params to locate the targeted manifest and execute the contract
 * using gathered inputs
 */
const executeContract: Handler = function (context, req, res, next) {
  const { manifest } = res.locals;

  assert(manifest, "[764b89cd] manifest not instantiated in middleware");

  const { contract, mutations } = manifest.execute(context, res.locals.inputs);

  res.locals.contract = contract;
  res.locals.mutations = mutations;

  return next();
};

export default executeContract;
