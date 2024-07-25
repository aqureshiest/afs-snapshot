import assert from "node:assert";
import createError from "http-errors";
import { Request, Response, NextFunction } from "express";

import { Application } from "../../typings/clients/application-service/index.js";
import { TEMP_DEFAULT_APPLICATION_QUERY } from "../../clients/application-service/graphql.js";
import flattenApplication from "../helpers.js";
import SensitiveString from "@earnest-labs/ts-sensitivestring";

const allowedEnvInjections = ["NEAS_BASE_URL", "BASE_URL"];

function error(res: Response, message: string | Array<string>) {
  let input = res.locals.input;
  if (!input) input = { application: null, applicationState: null, error: [] };
  if (!input.error) input.error = [];

  if (Array.isArray(message)) {
    input.error = input.error.concat(message);
  } else {
    if (!input.error.includes(message)) {
      input.error.push(message);
    }
  }
}

/* ============================== *
 * Gather inputs for contract execution
 * ============================== */
const getInputs: Handler = async function (
  context,
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const applicationId = req.params.id;
  const userId = res?.locals?.auth?.session?.userId;

  const ASclient = context?.loadedPlugins?.applicationServiceClient?.instance;
  assert(
    ASclient,
    new Error("[67c30fe0] Application Service client instance does not exist"),
  );

  /* ============================== *
   * I. Fetch Root Application
   * ============================== */
  let application;

  if (applicationId) {
    const { application: rootApplication } = (await ASclient.sendRequest(
      {
        query: TEMP_DEFAULT_APPLICATION_QUERY,
        variables: { id: applicationId, root: true },
      },
      context,
    )) as unknown as { application: Application };

    if (!rootApplication) {
      error(res, "application-not-found");
      throw new Error("[fc867b3a] Root application does not exist");
    }

    /* ============================== *
     * II. Flatten Root Application
     * ============================== */
    application = flattenApplication(rootApplication);

    const { primary, cosigner } = application;

    const applicants = [
      ...(primary ? [primary] : []),
      ...(cosigner ? [cosigner] : []),
    ];

    /* ============================== *
     * III. Session Authorization
     * ============================== */
    const isAuthorized = context.env.APP_ENV === "development" || applicants.reduce((authorized, applicant) => {
      const { monolithUserID } = applicant;

      if (monolithUserID && userId && monolithUserID == userId) {
        // for v1, at least one applicant has to be authorized
        authorized = true;
      }
      return authorized;
    }, false);
    /**
     * TODO: Temporarily comment out
     * remove .skip from get-inputs.test.ts as well
     */
    if (!isAuthorized) {
      error(res, "unauthorized");
      throw new createError.Forbidden(
        "[dfbaf766] Unauthorized - applicants lack permissions for this session",
      );
    }
  }

  const redisClient = context?.loadedPlugins?.redis?.instance;
  let applicationStep;
  if (redisClient && application) {
    applicationStep = await redisClient.getApplicationState(
      context,
      application.id,
      null,
    );
  }

  // injects env variables to res.locals.input for contract execution
  const env = {};
  if (context.env) {
    Object.keys(context.env).forEach((envKey) => {
      if (allowedEnvInjections.includes(envKey)) {
        env[envKey] = SensitiveString.ExtractValue(context.env[envKey]) || "";
      }
    });
  }

  res.locals.input = {
    env,
    applicationState: applicationStep,
    application: application,
    request: {
      originalUrl: req.originalUrl,
      method: req.method,
      params: req.params,
      body: req.body,
      query: req.query,
      headers: req.headers,
      cookies: req.cookies,
    },
  };

  return next();
};

export default getInputs;
