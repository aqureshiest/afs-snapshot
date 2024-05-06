import { Request, Response, NextFunction } from "express";
import session from "./strategies/session.js";
import internal from "./strategies/internal.js";

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

  if (idToken) {
    const sessionResults = await session(context, req);

    res.locals.auth = {
      ...(res.locals?.auth ?? {}),
      ...(sessionResults?.claims ?? {}),
    };
  }

  const authorizationHeader =
    (req.headers?.authorization as string) ||
    (req.headers?.Authorization as string);

  if (authorizationHeader) {
    internal(context, req);
  }

  return next();
};

export default authMiddleware;
