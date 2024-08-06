import {} from "handlebars";
import { createJsonHandlebars } from "handlebars-a-la-json";

import * as templateHelpers from "./template-helpers/index.js";
const handlebars = createJsonHandlebars();

Object.keys(templateHelpers).forEach((key) => {
  handlebars.registerHelper(key, templateHelpers[key]);
});

export const DEFAULT_OPTIONS = {
  allowedProtoProperties: {
    /**
     * Permit request headers to be accessed
     */
    headers: true,
    body: true,
  },
};

export default handlebars;
