import assert from "node:assert";
import { Request, Response, NextFunction } from "express";

import type NeasClient from "clients/NEAS/index.js";

/* eslint-disable @typescript-eslint/no-unused-vars */
export default async function (
  context: Context,
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const NeasClient = context.loadedPlugins.NeasClient?.instance as NeasClient<unknown[]>;
  assert(NeasClient, "[de7f7d6c] NeasClient is not instantiated");

  let claims = {};

  const session = req.cookies?.session
  if (session) {
    const artifacts = await NeasClient.getAuthStatus(session, context);
    if (artifacts) {
      claims = {
        session: {
          ...artifacts
        }
      }
    }
  }

  return claims;
}
