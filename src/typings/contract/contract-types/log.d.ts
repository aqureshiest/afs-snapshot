import type { Input as IContractInput } from "contract/manifest.js";
import type { PluginContext as ChassisPluginContext } from "@earnest-labs/microservice-chassis/PluginContext.js";
import type { CookieOptions } from "express";
import type { LogEntry } from "winston";

import { Application } from "@earnest/application-service-client/typings/codegen.js";
import type { ExecutionContext as IExecutionContext } from "contract/executable.js";

declare module "contract/contract-types/log.js" {
  type Input = IContractInput<{ application: Application | null }>;
  type Context = ChassisPluginContext;
  type ExecutionContext = IExecutionContext<unknown>;

  type Definition = LogEntry;
}

import "contract/contract-types/log.test.js";
declare module "contract/contract-types/log.test.js" {
  type Input = IContractInput<unknown>;
}
