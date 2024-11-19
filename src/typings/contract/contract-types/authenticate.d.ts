import type { Input as IContractInput } from "contract/manifest.js";
import type { PluginContext as ChassisPluginContext } from "@earnest-labs/microservice-chassis/PluginContext.js";

import { Application } from "@earnest/application-service-client/typings/codegen.js";
import type { ExecutionContext as IExecutionContext } from "contract/executable.js";

import type AuthenticateContract from "contract/contract-types/authenticate.js";
declare module "contract/contract-types/authenticate.js" {
  type Input = IContractInput<{ application: Application | null }>;
  type Context = ChassisPluginContext;
  type ExecutionContext = IExecutionContext<unknown>;

  type Auth = NonNullable<IContractInput<unknown>["auth"]>;

  const enum AuthMode {
    Optional = "optional",
    Required = "required",
  }

  type Definition = {
    strategies: Array<{ strategy?: string; mode?: AuthMode } & Auth>;
    mode?: AuthMode;
  };

  type Output = Auth;
}

import "contract/contract-types/authenticate.test.js";
declare module "contract/contract-types/authenticate.test.js" {
  type Input = IContractInput<unknown>;
}
