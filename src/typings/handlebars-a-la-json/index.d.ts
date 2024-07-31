import { create } from "handlebars";
import { createJsonHandlebars } from "handlebars-a-la-json";

declare module "handlebars-a-la-json" {
  // NOTE: the typing in "handlebars-a-la-json" is incomplete, so we substitute it with the type from "handlebars"
  export function createJsonHandlebars(
    options?: IOptions,
  ): ReturnType<typeof create>;
}
