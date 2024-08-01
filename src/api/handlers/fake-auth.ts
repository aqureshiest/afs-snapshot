import { Request, Response, NextFunction, RequestHandler } from "express";
import type { PluginContext as ChassisPluginContext } from "@earnest-labs/microservice-chassis/PluginContext.js";

type BoundHandler = (
  context: ChassisPluginContext,
  ...resolverArgs: Parameters<RequestHandler>
) => ReturnType<RequestHandler>;

/* eslint-disable @typescript-eslint/no-unused-vars */
const fakeAuthHandler: BoundHandler = async function (
  context,
  req: Request,
  res: Response,
  next: NextFunction,
) {
  return res.send("{}");
};

export default fakeAuthHandler;
