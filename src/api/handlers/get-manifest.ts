import assert from "node:assert";
import createError from "http-errors";

/**
 * Gather inputs for contract execution
 * TODO: get application from application-service
 * TODO: get authentication artifacts
 */
const getManifest: Handler = function (context, req, res, next) {
  const contracts = context.loadedPlugins.contractExecution.instance;

  assert(contracts);

  const pathParams = req.params.manifest.split("-");

  const manifest = contracts.Manifest.getManifest(context, pathParams);

  if (!manifest) {
    throw createError.NotFound();
  }

  res.locals.manifest = manifest;
  return next();
};

export default getManifest;
