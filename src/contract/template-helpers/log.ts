/* eslint-disable @typescript-eslint/no-unused-vars */
import contractHelper from "./contract.js";

const logHelper: TemplateHelper = function (...args) {
  const options = args[args.length - 1] as HelperOptions;
  const { context, manifest, self } = options.data;
  try {
    options.hash = options.hash || {};
    options.hash.type = "log";

    if ("fn" in options) {
      contractHelper.call(this, options);
    } else {
      const message = Array.prototype.slice.call(args, 0, -1).reduce((a, b) => {
        if (typeof b === "string" || typeof b === "number") {
          a.message =
            typeof a.message === "string" ? a.message + " " + b : String(b);
        }

        if (typeof b === "object") {
          return { ...a, ...b };
        }

        return a;
      }, {} as LogMessage);

      contractHelper.call(this, {
        ...(options as HelperOptions),
        fn: () => JSON.stringify(message),
      });
    }
  } catch (error) {
    /* noop */
  }
};

export default logHelper;
