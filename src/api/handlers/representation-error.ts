/* eslint-disable @typescript-eslint/no-unused-vars */
import createError, { HttpError } from "http-errors";
import { Request, Response, NextFunction } from "express";
import assert from "node:assert";

/**
 *
 */
const getErrorPageManifest = (
  context: Context,
  pathSegments: string[],
  statusCode: number,
): Manifest | void => {
  const contractExecution = context.loadedPlugins.contractExecution.instance;
  assert(contractExecution, "Missing contract definitions");

  const { Manifest, manifests, contracts } = contractExecution;

  while (pathSegments.length) {
    const errorPageManifestName =
      pathSegments.slice(0, -1).join("/") + `/${statusCode}`;
    const manifest = manifests[errorPageManifestName];

    /* ============================== *
     * TODO LA-714: instead of instantiating a new copy of the manifest for the
     * error page outputs, the manifests for the error pages should be shared
     * with the manifest created for the route handler
     * ============================== */

    if (manifest) {
      return new Manifest(
        errorPageManifestName,
        manifest["get"]["outputs"],
        contracts,
      );
    }

    pathSegments.pop();
  }
};

const representationErrorHandler: Handler = async function (
  context,
  error: HttpError,
  req: Request,
  res: Response,
  next: NextFunction,
) {
  if (req.method !== "GET") return next(error);

  // tries to load custom error page manifests based on the error status code and the path
  // if it fails to find any, it will return the formated error as normal.
  try {
    const { input, manifest } = res.locals;
    // const auth = input?.auth;
    // const userState = input?.userState;

    const pathSegments = req.url.split("/");
    const errorPageManifest = getErrorPageManifest(
      context,
      pathSegments,
      error.statusCode,
    );

    if (errorPageManifest) {
      res.locals.manifest = errorPageManifest;
      const results = await errorPageManifest.execute(
        context,
        { manifest: errorPageManifest },
        { ...input, manifest, request: req, response: res },
      );

      if ([401, 403].includes(error.statusCode)) {
        res.clearCookie("session", {
          httpOnly: true,
          secure: true,
          path: "/",
          sameSite: "strict",
          domain: ".earnest.com"
        });
        res.clearCookie("access_token");
      }

      return res.send(results);
    }
  } catch (err) {
    context.logger.error({
      message: err.message,
      stack: err.stack,
    });
  }

  return error.expose
    ? res.send({
        ...error,
        statusCode: error.statusCode,
      })
    : res.send({
        message: error.name,
        statusCode: error.statusCode,
      });
};

export default representationErrorHandler;
