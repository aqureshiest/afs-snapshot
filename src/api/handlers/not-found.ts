/* eslint-disable @typescript-eslint/no-unused-vars */
import createError from "http-errors";
import { Request, Response, NextFunction } from "express";

const notFoundHandler: Handler = async function (
  context,
  req: Request,
  res: Response,
  next: NextFunction,
) {
  return next(createError.NotFound());
};

export default notFoundHandler;
