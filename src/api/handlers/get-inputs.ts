/**
 * Gather inputs for contract execution
 * TODO: get application from application-service
 * TODO: get authentication artifacts
 */
const getInputs: Handler = async function (context, req, res, next) {
  // TODO: use the manifest (sourced from a previous middleware) to get a list of application
  // inputs that appear in the manifest

  // const references = res.locals.manifest?.references || [];

  const inputs = req.body ? req.body : {};
  res.locals.inputs = { ...inputs, request: req };
  return next();
};

export default getInputs;
