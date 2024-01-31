/* eslint-disable @typescript-eslint/no-unused-vars */

function ajvHelper(action, schema, data) {
    const ajv = chassisContext.loadedPlugins.schema.instance;
    if (!ajv) {
      throw new Error('[162d0439] schema dictionary not instantiated')
    }
    const validate = ajv.getSchema(schema);
    if (!validate) throw new Error('[dd8f1051] unable to load validation schema')
    const validation = validate(data);
    if (action === 'validate') {
      return validation;
    } else if (action === 'errors') {
      return ajv.errorsText(validate.errors)
    }
    return false;
  };

export default ajvHelper;
