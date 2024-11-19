import type { Input as IContractInput } from "contract/manifest.js";
import type { PluginContext as ChassisPluginContext } from "@earnest-labs/microservice-chassis/PluginContext.js";
import type { CookieOptions } from "express";

import { Application } from "@earnest/application-service-client/typings/codegen.js";
import type { ExecutionContext as IExecutionContext } from "contract/executable.js";

import type CookieContract from "contract/contract-types/cookie.js";
declare module "contract/contract-types/cookie.js" {
  type Input = IContractInput;
  type Context = ChassisPluginContext;
  type ExecutionContext = IExecutionContext;

  type Definition = {
    name: string;
    value?: string | null;
    options?: CookieOptions;
  };

  type Output = { action: string; success: boolean };
}

import "contract/contract-types/cookie.test.js";
declare module "contract/contract-types/cookie.test.js" {
  type Input = IContractInput;
}
