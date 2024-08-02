/* eslint-disable @typescript-eslint/no-unused-vars */
import createError, { HttpError } from "http-errors";
import { Request, Response, NextFunction } from "express";
import assert from "node:assert";

const errorHandler: Handler = async function (
  context,
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction,
) {
  if (!(error instanceof HttpError)) {
    context.logger.error({
      message: error.message,
      stack: error.stack,
    });
  }

  const convertedError =
    error instanceof HttpError
      ? error
      : createError.InternalServerError(error.message);

  res.status(convertedError.status).set(convertedError.headers);

  return next(convertedError);
};

export default errorHandler;
