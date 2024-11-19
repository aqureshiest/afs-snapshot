import createError from "http-errors";
/**
 * Raise an exception at the current scope
 */
export const raise: TemplateHelper = function (...args) {
  const options = args.pop() as HelperOptions;

  const { self, context } = options.data;

  self.error(false);

  /* ============================== *
   * Block form:
   * ============================== */
  if ("fn" in options) {
    const { message, statusCode = 500 } = options.hash;

    let extras;

    try {
      extras = options.fn(this);
      extras = JSON.parse(extras);
    } catch (error) {
      /* safely ignore failures to parse additional error information */
      self.log(context, { level: "warn", error });
    }

    const error = createError(statusCode, message, { cause: extras });
    self.error(error);
    return "";
  }

  const [message, statusCode] = args;

  const error = statusCode
    ? createError(statusCode, message)
    : new Error(message);

  self.error(error);

  return "";
};

export default raise;
