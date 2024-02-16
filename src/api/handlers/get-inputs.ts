import { IApplication } from "../../typings/clients/application-service/index.js";
import { Request, Response, NextFunction } from "express";
import assert from "node:assert";
/**
 * Gather inputs for contract execution
 * TODO: get authentication artifacts
 */
const getInputs: Handler = async function (
  context,
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const id = res.locals.application?.id;
  const ASclient = context.loadedPlugins.applicationServiceClient.instance;
  if (!ASclient)
    throw new Error("[67c30fe0] Application Service client instante not found");
  let application: IApplication | null = null;

  if (id) {
    try {
      application = await ASclient.getApplication(context, id);
      // we are gonna try the approach of always getting the Root Application in a flatten shape
      // by processing the relationships array, and putting them into their corresponding
      // keys on root Application

      if (application?.root?.id) {
        application = await ASclient.getApplication(
          context,
          application.root.id,
        );
      }
      if (application !== null) {
        // flatten application
        if (application.applicants.length == 1) {
          application.primary = application.applicants[0];
        } else {
          application.applicants.forEach((applicant) => {
            const relationshipsNotRoot = applicant["relationships"].filter(
              (relationship) => relationship.relationship !== "root",
            );
            relationshipsNotRoot.forEach((relationship) => {
              // typescript keeps complaining that application is possibly null, even tho it will never reach this line if it was
              assert(application);
              application[relationship.relationship] = applicant;
            });
          });
        }
      }
    } catch (ex) {
      context.logger.error({
        message: `[89af3057] error while retrieving application`,
        stack: ex.stack,
      });
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
