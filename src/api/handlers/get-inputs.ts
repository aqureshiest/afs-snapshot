import { Application } from "../../typings/clients/application-service/index.js";
import { TEMP_DEFAULT_APPLICATION_QUERY } from "../../clients/application-service/graphql.js";
import { Request, Response, NextFunction } from "express";
import flattenApplication from "../helpers.js";
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
    throw new Error("[67c30fe0] Application Service client instance not found");
  let application: Application | null = null;

  if (id) {
    try {
      const { application: app } = (await ASclient.sendRequest(
        {
          query: TEMP_DEFAULT_APPLICATION_QUERY,
          variables: { id },
        },
        context,
      )) as unknown as { application: Application };

      application = app;
      // we are gonna try the approach of always getting the Root Application in a flatten shape
      // by processing the relationships array, and putting them into their corresponding
      // keys on root Application
      if (application?.root?.id) {
        const { application: rootApplication } = (await ASclient.sendRequest(
          {
            query: TEMP_DEFAULT_APPLICATION_QUERY,
            variables: { id: application.root.id },
          },
          context,
        )) as unknown as { application: Application };

        application = rootApplication;
      }
      application = flattenApplication(application);
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
