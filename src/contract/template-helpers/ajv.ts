import Ajv from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

/* eslint-disable @typescript-eslint/no-unused-vars */

const ajvHelper = (bound: Injections) =>
  function (schemaName, data) {
    const {
      context: chassisContext,
      manifest,
      executions: [executions, newExecutions],
      mutations,
    } = bound;
    console.log('chassisContext', Object.keys(chassisContext))
    console.log('schema', schemaName)
    const contracts = bound.context.loadedPlugins?.contractExecution.instance
    console.log('contracts', contracts)
    if (contracts) {
      const schema = contracts[schemaName]
      if (schema) {
        console.log('schema', schema)
        const ajv = new Ajv.default();
        const validate = ajv.compile(schema)
      }
    }
    return false;
  };

export default ajvHelper;
