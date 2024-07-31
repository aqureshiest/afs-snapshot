/* eslint-disable @typescript-eslint/no-unused-vars */
import createError, { HttpError } from "http-errors";
import { Request, Response, NextFunction } from "express";
import assert from "node:assert";

const POSTerrorMap = {
  401: "unauthorized",
  404: "not-found",
  403: "unauthorized",
};

/**
 * tries to load custom error page manifests based on the error status code and the path
 * if it fails to find any, it will return the formated error as normal.
 */
const mutationErrorHandler: Handler = async function (
  context,
  error: HttpError,
  req: Request,
  res: Response,
  next: NextFunction,
) {
  if (POSTerrorMap[error.statusCode]) {
    return res.status(error.statusCode).send({
      status: "failed",
      results: [],
      error: [POSTerrorMap[error.statusCode]],
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

export default mutationErrorHandler;
