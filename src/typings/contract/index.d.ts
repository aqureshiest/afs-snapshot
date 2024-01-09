import type { Plugin as ChassisPlugin } from "@earnest-labs/microservice-chassis/Plugin.js";
import type { PluginContext as ChassisPluginContext } from "@earnest-labs/microservice-chassis/PluginContext.js";
import type { MutationType } from "contract/contract-types/base-contract.js";
import type { Request } from "express";
import { createJsonHandlebars } from "handlebars-a-la-json";
import type { Application as IApplication } from "clients/application-service/index.js";

import * as contractTypes from "contract/contract-types/index.js";
import type Contract from "contract/contract.js";
import type Manifest from "contract/manifest.js";

type HandlebarsTemplate = ReturnType<
  ReturnType<typeof createJsonHandlebars>["compile"]
>;

type IExecutions<M extends { [key: string]: Contract | Contract[] }> = Map<
  keyof M,
  unknown
>;

/**
 * TODO: fully define this shape
 */
interface IContractInput {
  [key: string]: unknown;
  request: Request;
  application: IApplication | null;
  manifestName: string;
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

/**
 */
type IContractManifest = Manifest;

type IContractManifests = {
  "*": never;
} & {
  [key: string]: IContractManifests | IContractManifest;
};

interface IExecutionInjections {
  context: ChassisPluginContext;
  manifest: Manifest;
  executions: IExecutions<{ [key: string]: Contract | Contract[] }>[];
  mutations: Record<string, MutationType<unknown, unknown>>;
  input: IContractInput;
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
}

declare module "contract/contract.js" {
  type Context = ChassisPluginContext;
  type Injections = IExecutionInjections;
  type Input = IContractInput;

  type ContstructorArguments = {
    key?: string;
    version?: string;
    folders?: string[];
    type?: string;
    raw: string;
  };

  type ContractType = Exclude<
    keyof typeof contractTypes,
    "ContractType" | "MutationType"
  >;

  type Template = HandlebarsTemplate;
  type ContextualManifest = Manifest;
  type Executions = IExecutions<{ [key: string]: Contract | Contract[] }>;
}

import "contract/manifest.js";
declare module "contract/manifest.js" {
  type Injections = IExecutionInjections;
  type Context = ChassisPluginContext;

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

  type Executions = IExecutions<{ [key: string]: Contract | Contract[] }>;
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
    mutations: Record<string, MutationType<unknown, unknown>>;
  }
}
