import assert from "node:assert";
import createError from "http-errors";

/**
 * Use the path params to locate the targeted manifest and execute the contract
 * using gathered inputs
 */
const executeContract: Handler = function (context, req, res, next) {
  const contracts = context.loadedPlugins.contractExecution.instance;
  assert(contracts);

  const pathParams = req.params.manifest.split("-");
  let manifest: Manifests | Manifests[string] = contracts.manifests;

  while (pathParams.length) {
    const param = pathParams.shift();
    assert(param);

    if (!(param in manifest)) throw createError.NotFound();

    manifest = manifest[param];
  }

  const { contract, mutations } = contracts.execute(
    res.locals.inputs,
    manifest,
  );

  res.locals.contract = contract;
  res.locals.mutations = mutations;

  /* ============================== *
   * TODO: If contracts have mutations, should we send the execution
   * without running mutations, or throw an error?
   * ============================== */

  return next();
};

export default executeContract;
