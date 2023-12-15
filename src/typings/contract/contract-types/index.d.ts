import type { Input as IContractInput } from "contract/manifest.js";
import type { PluginContext as ChassisPluginContext } from "@earnest-labs/microservice-chassis/PluginContext.js";
import type { Mutation } from "clients/application-service/index.js";

interface IContractArguments {
  id: string;
  definition: unknown;
  input: IContractInput;
  context: ChassisPluginContext;
}

import "contract/contract-types/base-contract.js";
declare module "contract/contract-types/base-contract.js" {
  type Context = ChassisPluginContext;
  type ContractArguments = IContractArguments;
}

import "contract/contract-types/application-event.js";
declare module "contract/contract-types/application-event.js" {
  type Input = IContractInput;
  type Context = ChassisPluginContext;
  type Definition = {
    event: string;
    id?: string;
    fields: string[];
    payload: { [key: string]: unknown };
    [key: string]: unknown;
  };

  type MinimalApplication = {
    id: string;
  };

  type Output = Mutation;
}

import "contract/contract-types/noop.js";
declare module "contract/contract-types/noop.js" {
  type Input = IContractInput;
  type Context = ChassisPluginContext;
  type Definition = boolean;

  type Output = Mutation;
}
