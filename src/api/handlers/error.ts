/* eslint-disable @typescript-eslint/no-unused-vars */
import createError, { HttpError } from "http-errors";
import { Request, Response, NextFunction } from "express";

const errorHandler: Handler = function (
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
