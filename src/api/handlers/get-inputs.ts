/**
 * Gather inputs for contract execution
 * TODO: get application from application-service
 * TODO: get authentication artifacts
 */
const getInputs: Handler = async function (context, req, res, next) {
  const inputs = req.body ? req.body : {};

  res.locals.inputs = {
    ...inputs,
    application: res.locals.application,
    request: req,
  };

  return next();
};

export default getInputs;
