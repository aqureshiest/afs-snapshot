import type { Input as IContractInput } from "contract/manifest.js";
import type { PluginContext as ChassisPluginContext } from "@earnest-labs/microservice-chassis/PluginContext.js";

import type { SchemaObject, ErrorObject } from "ajv";

import type { ExecutionContext as IExecutionContext } from "contract/executable.js";

declare module "contract/contract-types/validate.js" {
  type Input = IContractInput<unknown>;
  type Context = ChassisPluginContext;
  type ExecutionContext = IExecutionContext<unknown>;

  type Definition = {
    schema: SchemaObject;
    payload: unknown;
    /**
     * On validation failure, send as an error?
     */
    onError?:
      | boolean
      | {
          statusCode?: number;
          message?: string;
        };
  };

  type Transformation = {
    isValid: boolean | null;
    payload: unknown;
    errors?: ErrorObject[] | null;
    onError?: Definition["onError"];
  };
}

import "contract/contract-types/validate.test.js";
declare module "contract/contract-types/validate.test.js" {
  type Input = IContractInput<unknown>;
}
