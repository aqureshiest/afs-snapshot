import type { Plugin as ChassisPlugin } from "@earnest-labs/microservice-chassis/Plugin.js";
import type { PluginContext as ChassisPluginContext } from "@earnest-labs/microservice-chassis/PluginContext.js";
import type { MutationType } from "contract/contract-types/base-contract.js";
import type { Request } from "express";

import * as contractTypes from "contract/contract-types/index.js";
import type Contract from "contract/contract.js";
import type Manifest from "contract/manifest.js";

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
type IContractOutput = unknown;

interface IContracts {
  [key: string]: {
    [version: string]: Contract;
  };
}

interface IContractSubstitution {
  "?": string | string[];
  $: { [key: string]: string };
  "...": string | string[];
  "#": string;
  "@": string;
  coercion: string;
}

/**
 */
type IContractManifest = Manifest;

type IContractManifests = {
  "*": never;
} & {
  [key: string]: IContractManifests | IContractManifest;
};

interface IContractExecutor {
  (
    inputs: IContractInput,
    manifest: IContractManifest,
    contract?: Contract | Contract[],
  ): (typeof manifest)["contracts"]["*"] extends Contract[]
    ? IContractOutput[]
    : IContractOutput;
}

interface IExecuteContract {
  (
    inputs: IContractInput,
    manifest: IContractManifest,
    contract?: Contract | Contract[],
  ): (typeof manifest)["contracts"]["*"] extends Contract[]
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

  type ContractType = Exclude<
    keyof typeof contractTypes,
    "ContractType" | "MutationType"
  >;

  interface ContractReviver {
    (
      input: IContractInput,
      manifest: IContractManifest,
      key: string,
      value: ContractReference,
    ): ReturnType<Contract["execute"]>;
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

  type ContractType = Exclude<
    keyof typeof contractTypes,
    "ContractType" | "MutationType"
  >;

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

import "contract/revivers/remember-reference.js";
declare module "contract/revivers/remember-reference.js" {
  type ContractReviver = IContractReviver<IContractSubstitution>;
}

import "contract/revivers/operation.js";
declare module "contract/revivers/operation.js" {
  type ContractReviver = IContractReviver<IContractSubstitution>;
}

import "contract/manifest.test.js";
declare module "contract/manifest.test.js" {
  type Input = IContractInput;
  type Manifest = IContractManifest;
}

import "contract/ingestor.js";
declare module "contract/ingestor.js" {
  type Contracts = IContracts;

  type ContractType = Exclude<
    keyof typeof contractTypes,
    "ContractType" | "MutationType"
  >;

  type ManifestFile = Record<string, string | string[]>;
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

declare module "contract/contract.js" {
  type Context = ChassisPluginContext;

  type ContractReviver = IContractReviver;
  type ContractSubstitution = IContractSubstitution;
  type Input = IContractInput;

  type ContractType = Exclude<
    keyof typeof contractTypes,
    "ContractType" | "MutationType"
  >;
}

import "contract/manifest.js";
declare module "contract/manifest.js" {
  type Context = ChassisPluginContext;

  type ContractReviver = IContractReviver;
  type ContractSubstitution = IContractSubstitution;
  type Input = IContractInput;

  type ManifestFile = Record<string, string | string[]>;
  type Manifests = Manifest | IContractManifests;
  type Contracts =
    | {
        "*": Contract | Contract[];
      }
    | {
        [key: string]: Contract[];
      };
}

type ContractPlugin = ChassisPlugin<{
  Manifest: typeof Manifest;
  Contract: typeof Contract;
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
    manifest: Manifest;
    inputs: IContractInput;
    contract: IContractOutput;
    mutations: MutationType<unknown, unknown>[];
  }
}
