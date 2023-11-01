import type { Plugin as ChassisPlugin } from "@earnest-labs/microservice-chassis/Plugin.js";
import type { PluginContext as ChassisPluginContext } from "@earnest-labs/microservice-chassis/PluginContext.js";

/**
 * TODO: fully define this shape
 */
interface IContractInput {
  [key: string]: unknown;
}

/**
 * TODO: fully define this shape
 */
interface IContractOutput {
  [key: string]: unknown;
}

interface IContract {
  readonly type: string;
  readonly definition: string;
  output?: string;
}

interface IContracts {
  [key: string]: {
    [version: string]: IContract;
  };
}

interface IContractSubstitution {
  "?": string | string[];
  $: { [key: string]: string };
  "@": string;
  coercion: string;
}

/**
 */
type IContractManifest =
  | {
      "*": IContract | IContract[];
    }
  | {
      [key: string]: IContract[];
    };

interface IContractManifests {
  [key: string]: IContractManifests | IContractManifest;
}

interface IContractExecutor {
  (
    inputs: IContractInput,
    manifest: IContractManifest,
    contract?: IContract | IContract[],
  ): (typeof manifest)["*"] extends IContract[]
    ? Promise<IContractOutput[]>
    : Promise<IContractOutput>;
}

import "contract/contract-executor.js";
declare module "contract/contract-executor.js" {
  interface ExecuteContract {
    <Input, Output extends IContractOutput>(
      input: IContractInput,
      contract: IContract,
      definition: Input,
    ): Promise<Output>;
  }

  type ContractSubstitution = IContractSubstitution;

  interface ContractReviver<Value = object | string | number> {
    (
      input: IContractInput,
      manifest: IContractManifest,
      key: string,
      value: Value,
    ): Promise<unknown>;
  }

  /**
   * Given a set of inputs and a manifest containing contract descriptions,
   * substitute references and execute contract transformation methods to
   * produce either a representation or an execution plan
   *
   */
  type ContractExecutor = IContractExecutor;
}

import "contract/contract-executor.test.js";
declare module "contract/contract-executor.test.js" {
  type Manifest = IContractManifest;
}

import "contract/ingestor.js";
declare module "contract/ingestor.js" {
  type Contract = IContract;
  type Contracts = IContracts;

  type Manifest = IContractManifest;
  type Manifests = IContractManifests;

  interface BuildContracts {
    (context: ChassisPluginContext, path: string): Promise<Contracts>;
  }

  interface BuildManifests {
    (
      context: ChassisPluginContext,
      path: string,
      contracts: Contracts,
    ): Promise<{ totalManifests: number; manifests: Manifests }>;
  }

  interface IngestManifest {
    (
      context: ChassisPluginContext,
    ): Promise<{ contracts: Contracts; manifests: Manifests }>;
  }
}

import "contract/chassis-plugin.js";
declare module "contract/chassis-plugin.js" {
  type Plugin = ChassisPlugin<{
    manifests: IContractManifests;
    contracts: IContracts;
  }>;
  type Context = ChassisPluginContext;
}
