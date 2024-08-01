import { Request, Response, NextFunction } from "express";
import session from "./strategies/session.js";
import internal from "./strategies/internal.js";
import { Strategy } from "plaid";

export enum STRATEGIES {
  SESSION = "session",
  INTERNAL = "internal",
}

const authMiddleware = async (
  context: Context,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const idToken =
    (req.headers?.idToken as string) || (req.headers?.idtoken as string);
  const strategyResults: Array<Strategy | null> = [];
  const { 0: manifestName, id } = req.params;
  res.locals.manifestName = manifestName;
  res.locals.input = {
    env: {},
    applicationState: null,
    application: {
      id,
    },
    request: {
      originalUrl: req.originalUrl,
      method: req.method,
      params: {
        id,
      },
      body: req.body,
      query: req.query,
      headers: req.headers,
    },
  };
  if (idToken) {
    strategyResults.push((await session(context, req)) as unknown as Strategy);
  }

  const authorizationHeader =
    (req.headers?.authorization as string) ||
    (req.headers?.Authorization as string);

  if (authorizationHeader) {
    strategyResults.push((await internal(context, req)) as unknown as Strategy);
  }
  strategyResults.forEach((strategy) => {
    if (strategy) {
      res.locals.auth = {
        ...(res.locals?.auth || {}),
        [strategy["strategy"]]: strategy["claims"],
      };
    }
  });

  return next();
};

export default authMiddleware;
