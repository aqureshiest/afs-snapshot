import assert from "node:assert";
import createError from "http-errors";
import { Request, Response, NextFunction } from "express";

/**
 * Gather inputs for contract execution
 * TODO: get application from application-service
 * TODO: get authentication artifacts
 */
const getManifest: Handler = function (
  context,
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const manifests = context.loadedPlugins.contractExecution.instance?.manifests;

  assert(manifests);

  const { 0: manifestName, id } = req.params;

  res.locals.application = id ? { id } : null;

  const manifest = manifests[manifestName];

  if (!manifest) {
    throw createError.NotFound(
      `[58d1ca55] manifest "${manifestName}" not found`,
    );
  }

  res.locals.manifest = manifest;
  return next();
};

export default getManifest;
