import { Request, Response, NextFunction } from "express";
import strategies from "./strategies/index.js";

const authMiddleware = async (
  context: Context,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const claims: Promise<{ [key: string]: unknown }>[] = [];

  for (const strategy of strategies) {
    claims.push(strategy(context, req, res, next));
  }

  const resolved = await Promise.all(claims);
  resolved.forEach((claim) => {
    res.locals.auth = {
      ...(res.locals?.auth ?? {}),
      ...claim
    } 
  });

  next();
}

export default authMiddleware;