import { Request, Response, NextFunction } from "express";
import strategies from "./strategies/index.js";
import { HttpError } from "http-errors";

const authMiddleware = async (
  context: Context,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const claims: Promise<{ artifacts: unknown, error: HttpError | Error | null }>[] = [];

  for (const strategy of strategies) {
    claims.push(strategy(context, req));
  }

  const resolvedClaims = (await Promise.all(claims)).sort(byStatusCode);

  resolvedClaims.forEach((claim) => {
    if (claim.error) { // sorting guarantees the most severe error is thrown first
      throw claim.error;
    }

    res.locals.auth = {
      ...(res.locals?.auth ?? {}),
      ...((claim?.artifacts) ?? {})
    }
  }); 

  return next();
}

export default authMiddleware;

const byStatusCode = (a, b) => {
  const defaultStatusCode = 200; // assumption if an error doesn't exist
  const aStatusCode = a?.error ? a.error.statusCode : defaultStatusCode;
  const bStatusCode = b?.error ? b.error.statusCode : defaultStatusCode;

  return bStatusCode - aStatusCode;
}