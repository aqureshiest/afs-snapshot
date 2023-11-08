/* eslint-disable @typescript-eslint/no-unused-vars */
import createError, { HttpError } from "http-errors";
import { ErrorRequestHandler } from "express";

const errorHandler: ErrorRequestHandler = function (error, req, res, next) {
  const convertedError =
    error instanceof HttpError ? error : createError.InternalServerError(error);

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
