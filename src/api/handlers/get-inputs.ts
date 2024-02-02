import { IApplication } from "../../typings/clients/application-service/index.js";
import { Request, Response, NextFunction } from "express";

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
      body: req.body,
      query: req.query,
      headers: req.headers,
    },
  };
  return next();
};

export default getInputs;
