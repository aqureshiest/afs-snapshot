/**
 * Gather inputs for contract execution
 * TODO: get application from application-service
 * TODO: get authentication artifacts
 */
const getInputs: Handler = async function (context, req, res, next) {
  const application = req.body ? req.body : null;
  res.locals.inputs = { request: req, application };
  return next();
};

export default getInputs;
