import assert from "node:assert";
import createError from "http-errors";
import { Request, Response, NextFunction } from "express";

import { Application } from "../../typings/clients/application-service/index.js";
import { TEMP_DEFAULT_APPLICATION_QUERY } from "../../clients/application-service/graphql.js";
import flattenApplication from "../helpers.js";

/* ============================== *
 * Gather inputs for contract execution
 * ============================== */
const getInputs: Handler = async function (
  context,
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const applicationId = res?.locals?.application?.id;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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

    assert(
      rootApplication,
      new Error("[fc867b3a] Root application does not exist"),
    );

    /* ============================== *
     * II. Flatten Root Application
     * ============================== */
    application = flattenApplication(rootApplication);

    const { primary, cosigner } = application;

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const applicants = [
      ...(primary ? [primary] : []),
      ...(cosigner ? [cosigner] : []),
    ];

    /* ============================== *
     * III. Session Authorization
     * ============================== */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const isAuthorized = applicants.reduce((authorized, applicant) => {
      const { monolithUserID } = applicant;

      if (monolithUserID && userId && monolithUserID === userId) {
        // for v1, at least one applicant has to be authorized
        authorized = true;
      }
      return authorized;
    }, false);
    /**
     * TODO: Temporarily comment out
     * remove .skip from get-inputs.test.ts as well
     */
    assert(
      isAuthorized,
      new createError.Unauthorized(
        "[dfbaf766] Unauthorized - applicants lack permissions for this session",
      ),
    );

    if (application !== null && application?.applicants?.length) {
      // flatten application
      if (application.applicants.length == 1) {
        application.primary = application.applicants[0];
      } else {
        application.applicants.forEach((applicant) => {
          const relationshipNotRoot =
            applicant?.relationships?.filter(
              (r) => r?.relationship !== "root",
            ) || [];

          if (relationshipNotRoot.length) {
            relationshipNotRoot.forEach((relationship) => {
              const app = application?.applicants?.find(
                (a) => a?.id === relationship?.id,
              );

              if (
                app &&
                application &&
                relationship &&
                relationship.relationship
              ) {
                application[relationship.relationship] = app;
              }
            });
          }
        });
      }
    }
  }

  res.locals.input = {
    application: application,
    request: {
      method: req.method,
      params: req.params,
      body: req.body,
      query: req.query,
      headers: req.headers,
    },
  };

  return next();
};

export default getInputs;
