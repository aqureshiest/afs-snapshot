import assert from "node:assert";
import createError from "http-errors";
import { Request, Response, NextFunction } from "express";

/**
 * Gather inputs for contract execution
 * TODO: get application from application-service
 * TODO: get authentication artifacts
 */
const getManifest: Handler = async function (
  context,
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const manifests = context.loadedPlugins.contractExecution.instance?.manifests;

  assert(manifests);

  const { 0: manifestName, id } = req.params;

  res.locals.application = id ? { id } : null;
  res.locals.manifestName = manifestName;
  const manifest = manifests[manifestName];

  if (!manifest) {
    throw createError.NotFound(
      `[58d1ca55] manifest "${manifestName}" not found`,
    );
  }
  const redisClient = context?.loadedPlugins?.redis?.instance;
  if (redisClient && res.locals.auth && res.locals.auth.session?.userId) {
    res.locals.userState = await redisClient.getUserState(
      context,
      res.locals.auth.session.userId,
      null,
    );
  }
  res.locals.manifest = manifest;
  return next();
};

export default getManifest;
