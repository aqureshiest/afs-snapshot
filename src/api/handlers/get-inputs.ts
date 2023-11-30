/**
 * Gather inputs for contract execution
 * TODO: get application from application-service
 * TODO: get authentication artifacts
 */
const getInputs: Handler = async function (context, req, res, next) {

  const ApplicationServiceClient =
    context.loadedPlugins?.applicationServiceClient?.instance;

  if (!ApplicationServiceClient)
    throw new Error("[1d348234] Unable to load Application Service Client");

  const fieldKeys = [
    "id",
    "createdAt",
    "deletedAt",
    "name.first",
    "events.event",
    "events.id",
    "events.data",
  ];

  const queryResponse = await ApplicationServiceClient["query"](
    req.params.uuid,
    fieldKeys,
  );

  res.locals.inputs = { request: req, application: queryResponse };

  // TODO: use the manifest (sourced from a previous middleware) to get a list of application
  // inputs that appear in the manifest

  // const references = res.locals.manifest?.references || [];

  const inputs = req.body ? req.body : {};
  res.locals.inputs = { ...inputs, request: req };

  return next();
};

export default getInputs;
