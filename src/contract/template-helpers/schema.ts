/* eslint-disable @typescript-eslint/no-unused-vars */

const schemaHelper = function (schema, options) {
  const { context: chassisContext } = options.data;
  const ajv = chassisContext.loadedPlugins.schema.instance;
  if (!ajv) {
    throw new Error("[162d0439] schema dictionary not instantiated");
  }
  const validate = ajv.getSchema(schema);
  const schemaDefinition = validate.schema;
  delete schemaDefinition["$id"];
  return schemaDefinition;
};

export default schemaHelper;
