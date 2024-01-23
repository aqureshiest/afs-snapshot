import { IApplication } from '../../typings/clients/application-service/index.js';
import { Request, Response, NextFunction } from 'express';

// temporally hardcoding fields from ApplicationService
// TODO: find a dynamic way to get the fields from a configuration file.
const fields = [
  "id",
  "applicants.id",
  "details.name.first",
  "details.name.last",
  "root.id",
  "primary.id",
  "cosigner.id"
]

/**
 * Gather inputs for contract execution
 * TODO: get application from application-service
 * TODO: get authentication artifacts
 */
const getInputs: Handler = async function (context, req: Request, res: Response, next: NextFunction) {
  const inputs = req.body ? req.body : {};
  const id = res.locals.application?.id;
  const manifestName = res.locals.manifest.name
  const ASclient = context.loadedPlugins.applicationServiceClient.instance;
  if (!ASclient) throw new Error('[67c30fe0] Application Service client instante not found')
  let application: IApplication | null = null
  if (id) {
    try {
      application = await ASclient.getApplication(context, id, fields)
    } catch (ex) {
      context.logger.error({
        message: `[89af3057] error while retrieving application`,
        stack: ex.stack
      })
    }
  }
  res.locals.inputs = {
    manifestName,
    ...inputs,
    application: application,
    request: req,
  };
  console.log('application', application)
  return next();
};

export default getInputs;
