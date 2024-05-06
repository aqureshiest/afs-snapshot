import assert from "node:assert";
import { Request } from "express";
import createError from "http-errors";

import type NeasClient from "clients/NEAS/index.js";
import { STRATEGIES } from "../index.js";

export default async function (
  context: Context,
  req: Request,
): Promise<Strategy> {
  const NeasClient = context.loadedPlugins.NeasClient?.instance as NeasClient;
  assert(NeasClient, "[de7f7d6c] NeasClient is not instantiated");

  const strategy: Strategy = {
    strategy: STRATEGIES.SESSION,
    claims: null,
    error: [],
  };

  /* ============================== *
   * I. Parse Authorization Headers
   * -- idToken is set when valid session is passed to NEAS
   * ============================== */
  const idToken =
    (req.headers?.idToken as string) || (req.headers?.idtoken as string);

  if (!idToken) {
    strategy.error.push(createError.Unauthorized(
      "[6a1bed98] Unauthorized - missing idToken in request headers",
    ));
  }
  /* ============================== *
   * II. Token Verification
   * ============================== */
  if (idToken) {
    const { results, response } = await NeasClient.verifyToken(idToken, context);

    if (response.statusCode === 400) {
      strategy.error.push(createError.Unauthorized(
        "[a6b44191] Unauthorized - invalid idToken",
      ));
    }

    const { exp } = results;
    const now = Math.floor(Date.now() / 1000);

    if (exp && (now > exp)) {
      strategy.error.push(createError.Unauthorized(
        "[0963fa22] Unauthorized - session expired",
      ));
    }
    /* ============================== *
     * III. Set Claims
     * ============================== */
    if (results) {
      strategy.claims = {
        session: {
          ...results,
        }
      };
    }
  }

  return strategy;
}
