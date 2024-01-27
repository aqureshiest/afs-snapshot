import assert from "node:assert";
import createError from "http-errors";

import * as constants from "../constants.js";

/**
 * Gather inputs for contract execution
 * TODO: get application from application-service
 * TODO: get authentication artifacts
 */
const getManifest: Handler = function (context, req, res, next) {
  const contracts = context.loadedPlugins.contractExecution.instance;

  assert(contracts);

  const params = req.params[0].split("/");
  const id = constants.UUID_REGEX.test(params[params.length - 1])
    ? params.pop()
    : null;

  res.locals.application = id ? { id } : null;

  const manifest = contracts.Manifest.getManifest(context, params);

  if (!manifest) {
    throw createError.NotFound(`[58d1ca55] manifest not found ${params.join('/')}`);
  }

  res.locals.manifest = manifest;
  return next();
};

export default getManifest;
