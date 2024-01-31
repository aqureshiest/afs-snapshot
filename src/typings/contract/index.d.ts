import type { Plugin as ChassisPlugin } from "@earnest-labs/microservice-chassis/Plugin.js";
import type { PluginContext as ChassisPluginContext } from "@earnest-labs/microservice-chassis/PluginContext.js";
import type ContractType from "contract/contract-types/base-contract.js";
import { create } from "handlebars";
import { createJsonHandlebars } from "handlebars-a-la-json";
import type { Application as IApplication } from "clients/application-service/index.js";
import Ajv from "ajv/dist/2020.js";
import * as contractTypes from "contract/contract-types/index.js";
import type Contract from "contract/contract.js";
import type Manifest from "contract/manifest.js";

type HandlebarsTemplate = ReturnType<
  ReturnType<typeof createJsonHandlebars>["compile"]
>;

declare module "handlebars-a-la-json" {
  // NOTE: the typing in "handlebars-a-la-json" is incomplete, so we substitute it with the type from "handlebars"
  export function createJsonHandlebars(
    options?: IOptions,
  ): ReturnType<typeof create>;
}

type IExecutions<M extends { [key: string]: Contract | Contract[] }> = Map<
  keyof M,
  unknown
>;

type Method = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

/**
 * TODO: fully define this shape
 */
type IContractInput = {
  application: IApplication | null;
  request?: {
    method?: string;
    body?: { [key: string]: unknown };
    query?: { [key: string]: unknown };
    headers?: { [key: string]: unknown };
  };
};

/**
 * TODO: fully define this shape
 */
type IContractOutput = unknown;

interface IContracts {
  [key: string]: {
    [version: string]: Contract;
  };
}
type ISchema = {[key: string]: unknown };
type ISchemas = {
  [key: string]: ISchema
};
/**
 */
type IContractManifest = Manifest;

type IContractManifests = {
  "*": never;
} & {
  [key: string]: IContractManifests | IContractManifest;
};

interface IEvaluations {
  [key: string]:
    | ContractType<unknown, unknown, unknown>
    | ContractType<unknown, unknown, unknown>[];
}

interface IDependencies {
  [key: string]: ContractType<unknown, unknown, unknown>;
}

interface IExecutionInjections extends IContractInput {
  context: ChassisPluginContext;
  manifest: Manifest;
  // All known contract instances by key
  evaluations: IEvaluations;
  dependents: IDependencies;
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
    "ContractType" | "AsyncContractType"
  >;

  type ManifestFile = Record<string, string | string[]>;
  type Manifest = IContractManifest;
  type Manifests = IContractManifests;
  type Schema = ISchema;
  type Schemas = ISchemas;
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
  interface BuildSchemas {
    (
      context: ChassisPluginContext,
      path: string
    ): Promise<{ totalSchemas: number; schemas: Schemas }>;
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
    "ContractType" | "AsyncContractType"
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
    input: IContractInput;
    contract: IContractOutput;
    evaluations: Record<string, ContractType<unknown, unknown>>;
  }
}
