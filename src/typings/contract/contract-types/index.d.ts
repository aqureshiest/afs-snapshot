import type { Input as IContractInput } from "contract/manifest.js";
import type { PluginContext as ChassisPluginContext } from "@earnest-labs/microservice-chassis/PluginContext.js";
import type { Application as IApplication } from "clients/application-service/index.js";

import "contract/contract-types/base-contract.js";
declare module "contract/contract-types/base-contract.js" {
  type Context = ChassisPluginContext;
  interface Execution<This, Input, Output = unknown> {
    (this: This, input: Input): Output;
  }

  interface Coercion<Input, Coerced> {
    <This>(this: This, input: Input): Coerced;
  }
}

import "contract/contract-types/application-event.js";
declare module "contract/contract-types/application-event.js" {
  type Input = IContractInput;
  type Context = ChassisPluginContext;
  type Definition = {
    event: string;
    id?: string;
    [key: string]: unknown;
  };

  type MinimalApplication = {
    id: string;
  };

  /* ============================== *
   * TODO: remove MinimalApplication when ApplicationServiceClient has been fully integrated
   * ============================== */

  type Output = {
    id: string;
    application: IApplication | MinimalApplication;
  };
}
