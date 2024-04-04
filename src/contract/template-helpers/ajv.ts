/* eslint-disable @typescript-eslint/no-unused-vars */
import assert from "node:assert";

const ajvHelper: TemplateHelper = function (action, schema, data, ...args) {
  assert(typeof action === "string");

  const options = args[args.length - 1];

  assert(typeof options !== "string", "[170caf61] Invalid template options");

  const { context: chassisContext } = options.data;
  const ajv = chassisContext.loadedPlugins.schema.instance;
  if (!ajv) {
    throw new Error("[162d0439] schema dictionary not instantiated");
  }
  const validate = ajv.getSchema(schema);
  if (!validate) {
    throw new Error("[dd8f1051] unable to load validation schema");
  }
  const validation = validate(data);
  if (action === "validate") {
    return validation;
  } else if (action === "errors") {
    return ajv.errorsText(validate.errors).replaceAll('"', `'`);
  }
  return false;
};

export default ajvHelper;
