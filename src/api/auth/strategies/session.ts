import assert from "node:assert";
import { Request } from "express";
import createError from "http-errors";

import type NeasClient from "clients/NEAS/index.js";

export default async function (context: Context, req: Request): Promise<Strategy> {
  const NeasClient = context.loadedPlugins.NeasClient?.instance as NeasClient<unknown[]>;
  assert(NeasClient, "[de7f7d6c] NeasClient is not instantiated");

  let strategy: Strategy = { artifacts: null, error: null, };
  
  let idToken = req.headers?.idToken as string || req.headers?.idtoken as string;
  assert(idToken, createError.Unauthorized("[6a1bed98] Unauthorized - missing idToken in request headers"));

  const { results, response } = await NeasClient.verifySession(idToken, context);

  if (response.statusCode === 400) {
    strategy.error = createError.Unauthorized("[a6b44191] Unauthorized");
  }

  if (results) {
    strategy.artifacts = {
      session: {
        ...results,
      }
    }
  }

  return strategy;
}
