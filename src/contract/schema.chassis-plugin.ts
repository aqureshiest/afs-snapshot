import Ajv from "ajv";
import addFormats from "ajv-formats";
import ajvErrors from "ajv-errors";

import { buildSchemas } from "./ingestor.js";
import * as path from "node:path";
import type { Plugin } from "@earnest-labs/microservice-chassis/Plugin.js";
import type { PluginContext } from "@earnest-labs/microservice-chassis/PluginContext.js";

const SCHEMAS_PATH = path.join("flows", "contracts");
declare module "@earnest-labs/microservice-chassis/PluginContext.js" {
  interface LoadedPlugins {
    schema: Plugin<Ajv.default>;
  }
}

/* ============================== *
 * Schema Dictionary:
 * ------------------------------ *
 * Manage a shared Ajv instance that tracks shared JSON schema
 * for the constituent schema dictionaries
 * ============================== */

export const plugin: Plugin<unknown> = {
  name: "schema",
  version: "1.0.0",
  registerOrder: -1,
  register: async (context: PluginContext) => {
    const ajv = new Ajv.default({ allErrors: true, $data: true });
    addFormats.default(ajv);
    ajvErrors.default(ajv);
    const definitions = await buildSchemas(context, SCHEMAS_PATH);
    Object.keys(definitions.schemas).forEach((schemaName) => {
      const definition = definitions.schemas[schemaName];
      const isValid = ajv.validateSchema(definition);
      if (isValid) {
        ajv.compile(definition);
      } else {
        context.logger.error({
          message: ajv.errorsText(),
          errors: ajv.errors,
        });

        throw new Error(
          `[68ccf021] JSON schema failed validation ${definition["$id"]}`,
        );
      }
    });
    plugin.instance = ajv;
  },
};
