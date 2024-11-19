export const json: TemplateHelper = function (value) {
  return JSON.stringify(value ?? null);
};

export default json;
