import assert from "node:assert";
import { Request } from "express";
import createError from "http-errors";

import type NeasClient from "clients/NEAS/index.js";

export default async function (
  context: Context,
  req: Request,
): Promise<Strategy> {
  const NeasClient = context.loadedPlugins.NeasClient?.instance as NeasClient<
    unknown[]
  >;
  assert(NeasClient, "[de7f7d6c] NeasClient is not instantiated");

  const strategy: Strategy = { artifacts: null, error: null };

  const idToken =
    (req.headers?.idToken as string) || (req.headers?.idtoken as string);
  assert(
    idToken,
    createError.Unauthorized(
      "[6a1bed98] Unauthorized - missing idToken in request headers",
    ),
  );

  const { results, response } = await NeasClient.verifyToken(
    idToken,
    context,
  );

  if (response.statusCode === 400) {
    strategy.error = createError.Unauthorized(
      "[a6b44191] Unauthorized - invalid session",
    );
  }

  const { exp } = results;

  const now = Math.floor(Date.now() / 1000);

  if (now > exp) {
    strategy.error = createError.Unauthorized(
      "[0963fa22] Unauthorized - session expired",
    );
  }

  if (results) {
    strategy.artifacts = {
      session: {
        ...results,
      },
    };
  }

  return strategy;
}
