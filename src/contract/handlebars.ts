import {} from "handlebars";
import { createJsonHandlebars } from "handlebars-a-la-json";
import Executable from "./executable.js";
import * as templateHelpers from "./template-helpers/index.js";
const handlebars = createJsonHandlebars();

Object.keys({ ...templateHelpers, ...handlebars.helpers }).forEach((key) => {
  const helperFunction =
    key in templateHelpers ? templateHelpers[key] : handlebars.helpers[key];

  /**
   * converts any executable references provided as arguments to their JSON value
   */
  const helper = function (...args) {
    return helperFunction.apply(
      this,
      args.map((arg) => (arg instanceof Executable ? arg.toJSON() : arg)),
    );
  };

  Object.defineProperty(helper, "name", { value: key });

  handlebars.registerHelper(key, helper);
});

export const DEFAULT_OPTIONS = {
  allowedProtoProperties: {
    /**
     * Permit request headers to be accessed
     */
    headers: true,
    body: true,
    query: true,
    hostname: true,
  },
};

export default handlebars;
