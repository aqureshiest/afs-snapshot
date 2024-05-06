import { Request, Response, NextFunction } from "express";
import strategies from "./strategies/index.js";
import { HttpError } from "http-errors";

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
  const results: Promise<{
    strategy: string;
    claims: unknown;
    error: HttpError[];
  }>[] = [];

  /* ============================== *
   * I. Auth Strategy Execution
   * ============================== */
  for (const strategy of strategies) {
    results.push(strategy(context, req));
  }

  const resolvedStrategies = (await Promise.all(results));

  const regEx = new RegExp(`${context.env.NEAS_BASE_URL}`);

  const publicRequest = regEx.test(req.url);
  const internalRequest = !publicRequest;

  resolvedStrategies.forEach((strat) => {
  /* ============================== *
   * II. Public Authorization
   * ============================== */
    if (publicRequest && strat.strategy === STRATEGIES.SESSION && strat.error.length) {
      // throw the first session error encountered
      throw strat.error.shift();
    }

  /* ============================== *
   * III. Internal Authorization
   * ============================== */
    if (
      internalRequest &&
      strat.strategy === STRATEGIES.INTERNAL &&
      strat.error.length
    ) {
      // throw the first internal error encountered
      throw strat.error.shift();
    }

  /* ============================== *
   * IV. Assign Claims
   * ============================== */
    res.locals.auth = {
      ...(res.locals?.auth ?? {}),
      ...(strat?.claims ?? {}),
    };
  });

  return next();
};

export default authMiddleware;