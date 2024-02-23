import type { Input as IContractInput } from "contract/manifest.js";
import type { PluginContext as ChassisPluginContext } from "@earnest-labs/microservice-chassis/PluginContext.js";
import {
  Application,
  Event,
  EventName,
  ApplicationSearchCriteria
} from "@earnest/application-service-client/typings/codegen.js";
import IContract, {
  Injections as IExecutionInjections,
} from "contract/contract.js";

interface IContractArguments<D> {
  id: string;
  definition: D;
  input: IContractInput;
  context: ChassisPluginContext;
}

import "contract/contract-types/base-contract.js";
declare module "contract/contract-types/base-contract.js" {
  /**
   * ContractType constructor
   */
  interface ConstructorArguments {
    id: string;
    contract: IContract;
  }

  type Injections = IExecutionInjections;

  type ContractArguments<D> = IContractArguments<D>;
  type Context = ChassisPluginContext;
}

import "contract/contract-types/noop.js";
declare module "contract/contract-types/noop.js" {
  type Input = IContractInput;
  type Context = ChassisPluginContext;
  type Definition = boolean;

  type Output = {
    [key: string]: {
      [key: string]: {
        [key: string]: unknown;
      };
    };
  };
}

interface IMutationSchema {
  __type: {
    name: string;
    fields: Array<{
      name: string;
      args: Array<{
        name: string;
        type: {
          name: string;
          kind: string;
          ofType?: {
            name: string;
          };
        };
      }>;
    }>;
  };
}

import "contract/contract-types/application-event.js";
declare module "contract/contract-types/application-event.js" {
  type Input = IContractInput;
  type Context = ChassisPluginContext;
  type Definition = {
    event: EventName;
    id?: string;
    fields: string;
    payload: { [key: string]: unknown };
    [key: string]: unknown;
  };

  type Injections = IExecutionInjections;

  type MinimalApplication = {
    id: string;
  };

  type MutationSchema = IMutationSchema;

  type Output = { [key: string]: Event };
}

import "contract/contract-types/syllabus-section.js";
declare module "contract/contract-types/syllabus-section.js" {
  type Context = ChassisPluginContext;
  type Definition = {
    status: string;
    statuses: string[];
    progress: number;
    [key: string]: unknown;
  };
  type Transformation = {
    status: string;
    progress: number;
    [key: string]: unknown;
  };

  type Injections = IExecutionInjections;

  type MinimalApplication = {
    id: string;
  };
}

import "contract/contract-types/application-data.js";
declare module "contract/contract-types/application-data.js" {
  type Input = IContractInput;
  type Context = ChassisPluginContext;

  type LookupDefinition =
    | { id: string }
    | {
        criteria: ApplicationSearchCriteria[];
      };

  type Definition = LookupDefinition;

  type Injections = IExecutionInjections;

  type MinimalApplication = {
    id: string;
  };

  type Output = Application | Application[];
}
