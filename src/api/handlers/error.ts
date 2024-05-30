/* eslint-disable @typescript-eslint/no-unused-vars */
import createError, { HttpError } from "http-errors";
import { Request, Response, NextFunction } from "express";
import assert from "node:assert";

const getErrorPageManifest = (context, splittedPath, statusCode) => {
  const manifests = context.loadedPlugins.contractExecution.instance?.manifests;
  assert(manifests);
  const errorPageManifestName =
    splittedPath.slice(0, -1).join("/") + `/${statusCode}`;
  const manifest = manifests[errorPageManifestName];
  if (manifest) {
    return manifest;
  } else {
    if (splittedPath.length > 0) {
      return getErrorPageManifest(
        context,
        splittedPath.slice(0, -1),
        statusCode,
      );
    }
  }
};
const POSTerrorMap = {
  401: "unauthorized",
  404: "not-found",
  403: "unauthorized",
};
const errorHandler: Handler = async function (
  context,
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction,
) {
  context.logger.error({
    message: error.message,
    stack: error.stack,
  });

  const convertedError =
    error instanceof HttpError
      ? error
      : createError.InternalServerError(error.message);

  // tries to load custom error page manifests based on the error status code and the path
  // if it fails to find any, it will return the formated error as normal.
  if (req.method === "GET") {
    try {
      const { input, auth, userState, manifestName } = res.locals;

      const splittedPath = manifestName.split("/");
      const errorPageManifest = getErrorPageManifest(
        context,
        splittedPath,
        convertedError.statusCode,
      );

      if (errorPageManifest) {
        res.locals.manifest = errorPageManifest;
        const { contract } = await errorPageManifest.execute(
          {
            manifest: errorPageManifest,
            auth,
            userState,
            error,
            input,
          },
          { context, ...input },
        );
        return res.status(convertedError.statusCode).send(contract);
      }
    } catch (error) {
      context.logger.error({
        message: error.message,
        stack: error.stack,
      });
    }
  } else if (POSTerrorMap[convertedError.statusCode]) {
    return res.status(convertedError.statusCode).send({
      status: "failed",
      results: [],
      error: [POSTerrorMap[convertedError.statusCode]],
    });
  }
  /////////////////////////////

  res.status(convertedError.statusCode).set(convertedError.headers);

  return convertedError.expose
    ? res.send({
        ...convertedError,
        statusCode: convertedError.statusCode,
      })
    : res.send({
        message: convertedError.name,
        statusCode: convertedError.statusCode,
      });
};

export default errorHandler;
