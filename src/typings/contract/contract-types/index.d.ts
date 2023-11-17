import type {
  Input as IContractInput,
  Manifest as IContractManifest,
} from "contract/contract-executor.test.js";
import type { PluginContext as ChassisPluginContext } from "@earnest-labs/microservice-chassis/PluginContext.js";

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
  type Context = ChassisPluginContext;
  type Definition = {
    event: string;
    [key: string]: unknown;
  };
  type Output = unknown;
}

import "contract/contract-types/or.test.js";
declare module "contract/contract-types/or.test.js" {
  type Input = IContractInput;
  type Manifest = IContractManifest;
}

import "contract/contract-types/and.test.js";
declare module "contract/contract-types/and.test.js" {
  type Input = IContractInput;
  type Manifest = IContractManifest;
}

import "contract/contract-types/not.test.js";
declare module "contract/contract-types/not.test.js" {
  type Input = IContractInput;
  type Manifest = IContractManifest;
}
