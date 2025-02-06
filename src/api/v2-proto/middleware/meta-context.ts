// c8 ignore file
import httpContext from "express-http-context";

import type PluginContext from "@earnest-labs/microservice-chassis/PluginContext.js";
import type { Request, Response, NextFunction } from "express";
import type { Glob_Method } from "../index.js";

type Middleware_Meta = {
  endpoint: string;
  manifest: string;
  method: Glob_Method;
};

const metaContext =
  (context: PluginContext, meta: Middleware_Meta) =>
  (req: Request, res: Response, next: NextFunction) => {
    httpContext.set("meta", meta);
    next();
  };

export default metaContext;
