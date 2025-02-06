// c8 ignore file
import httpContext from "express-http-context";

const chassisContext =
  (context: unknown, options = {}) =>
  (req, res, next) => {
    httpContext.set("context", context);
    next();
  };

export default chassisContext;
