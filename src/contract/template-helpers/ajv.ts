import Ajv from "ajv";
import addFormats from "ajv-formats";
import ajvErrors from 'ajv-errors';
/* eslint-disable @typescript-eslint/no-unused-vars */

const ajvHelper = (bound: Injections) =>
  function (action, schema, data) {
    const {
      context: chassisContext,
      manifest,
      executions: [executions, newExecutions],
      mutations,
    } = bound;
    const ajv = new Ajv.default({allErrors: true, $data: true});
    addFormats.default(ajv);
    ajvErrors.default(ajv);
    const validate = ajv.compile(JSON.parse(schema));
    const validation = validate(data);
    if (action === 'validate') {
      return validation;
    } else if (action === 'errors') {
      console.log(`errors ${ajv.errorsText(validate.errors)}`, )
      return ajv.errorsText(validate.errors)
    }
    
  };

export default ajvHelper;
