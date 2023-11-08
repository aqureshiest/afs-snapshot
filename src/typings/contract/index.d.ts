import type { Plugin as ChassisPlugin } from "@earnest-labs/microservice-chassis/Plugin.js";
import type { PluginContext as ChassisPluginContext } from "@earnest-labs/microservice-chassis/PluginContext.js";
import type { MutationType } from "contract/contract-types/base-contract.js";
import type { Request } from "express";
import * as contractTypes from "contract/contract-types/index.js";

interface Application {
  [key: string]: unknown;
}

/**
 * TODO: fully define this shape
 */
interface IContractInput {
  [key: string]: unknown;
  request: Request;
  application: Application | null;
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

type IContractManifests = {
  "*": never;
} & {
  [key: string]: IContractManifests | IContractManifest;
};

interface IContractExecutor {
  (
    inputs: IContractInput,
    manifest: IContractManifest,
    contract?: IContract | IContract[],
  ): (typeof manifest)["*"] extends IContract[]
    ? IContractOutput[]
    : IContractOutput;
}

interface IExecuteContract {
  (
    inputs: IContractInput,
    manifest: IContractManifest,
    contract?: IContract | IContract[],
  ): (typeof manifest)["*"] extends IContract[]
    ? {
        contract: IContractOutput[];
        mutations: MutationType<unknown, unknown>[];
      }
    : {
        contract: IContractOutput;
        mutations: MutationType<unknown, unknown>[];
      };
}

interface IContractReviver<Value = object | string | number> {
  (
    input: IContractInput,
    manifest: IContractManifest,
    key: string,
    value: Value,
  ): unknown;
}

import "contract/revivers/reviver.js";
declare module "contract/revivers/reviver.js" {
  type ContractReviver = IContractReviver;
  type ContractSubstitution = IContractSubstitution;
}

import "contract/revivers/concatenate.js";
declare module "contract/revivers/concatenate.js" {
  type ContractReviver = IContractReviver;
}

import "contract/revivers/contract-reference.js";
declare module "contract/revivers/contract-reference.js" {
  interface ContractReference {
    $: string;
    coercion: string;
  }

  interface ContractReviver<T extends keyof typeof contractTypes> {
    (
      input: IContractInput,
      manifest: IContractManifest,
      key: string,
      value: ContractReference,
    ): ReturnType<InstanceType<(typeof contractTypes)[T]>["toJSON"]>;
  }
}

import "contract/revivers/embedded-contract.js";
declare module "contract/revivers/embedded-contract.js" {
  interface EmbeddedContract<
    K extends keyof typeof contractTypes = keyof typeof contractTypes,
  > {
    "@": K;
    $: unknown;
    $NOT: unknown;
    $OR: unknown;
    $AND: unknown;
    coercion: string;
  }

  interface ContractReviver<K extends keyof typeof contractTypes> {
    (
      input: IContractInput,
      manifest: IContractManifest,
      key: string,
      value: EmbeddedContract<K>,
    ): ReturnType<InstanceType<(typeof contractTypes)[K]>["toJSON"]>;
  }
}

import "contract/revivers/input-reference.js";
declare module "contract/revivers/input-reference.js" {
  type ContractReviver = IContractReviver<IContractSubstitution>;
}

import "contract/revivers/operation.js";
declare module "contract/revivers/operation.js" {
  type ContractReviver = IContractReviver<IContractSubstitution>;
}

import "contract/contract-executor.js";
declare module "contract/contract-executor.js" {
  /**
   * Given a set of inputs and a manifest containing contract descriptions,
   * substitute references and execute contract transformation methods to
   * produce either a representation or an execution plan
   *
   */
  type ContractExecutor = IContractExecutor;
  type ExecuteContract = IExecuteContract;
}

import "contract/contract-executor.test.js";
declare module "contract/contract-executor.test.js" {
  type Input = IContractInput;
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

declare module "contract/contract-types/base-contract.js" {
  type Input = IContractInput;

  interface Coercion<Input, Coerced> {
    <This>(this: This, input: Input): Coerced;
  }
}

type ContractPlugin = ChassisPlugin<{
  execute: IExecuteContract;
  manifests: IContractManifests;
  contracts: IContracts;
}>;

import "contract/chassis-plugin.js";
declare module "contract/chassis-plugin.js" {
  type Plugin = ContractPlugin;
  type Context = ChassisPluginContext;
}

declare module "@earnest-labs/microservice-chassis/PluginContext.js" {
  interface LoadedPlugins {
    contractExecution: ContractPlugin;
  }
  type Context = ChassisPluginContext;
}

import "express-serve-static-core";
declare module "express-serve-static-core" {
  interface Locals {
    inputs: IContractInput;
    contract: IContractOutput;
    mutations: MutationType<unknown, unknown>[];
  }
}
