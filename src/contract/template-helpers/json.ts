export const json: TemplateHelper = function (value) {
  return JSON.stringify(value ?? null) || "null";
};

export default json;
