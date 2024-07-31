import { Request } from "express";
import createError from "http-errors";

import SensitiveString from "@earnest-labs/ts-sensitivestring";

export default async function (
  context: Context,
  req: Request,
): Promise<Strategy> {
  const LDS_S2S_KEY =
    SensitiveString.ExtractValue(context.env.S2S_KEY_LDS_APPLY_FLOW_SERVICE) ||
    "";
  /* ============================== *
   * I. Validate Auth Scheme
   * ============================== */
  const authorization = req.headers.authorization || "";

  const regex = /^Bearer\s+(\S+)$/;
  const matchedAuthHeader =
    authorization.match(regex) ||
    (context.env.APP_ENV === "development" ? ["string"] : []);

  if (!matchedAuthHeader.length || !matchedAuthHeader[1]) {
    throw createError.BadRequest(
      "[0f415288] Bad Request - request did not match required auth scheme",
    );
  }
  /* ============================== *
   * II. Access Key Verification
   * ============================== */
  if (matchedAuthHeader[1]) {
    const accessKeys = [LDS_S2S_KEY];

    const isAuthorized =
      context.env.APP_ENV === "development" ||
      accessKeys.includes(matchedAuthHeader[1]);

    if (!isAuthorized) {
      throw createError.Unauthorized("[9736e5c6] Unauthorized - invalid key");
    }
  }
  return {
    strategy: "internal",
    claims: {
      isValid: true,
    },
  };
}
