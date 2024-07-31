import { createJsonHandlebars } from "handlebars-a-la-json";
import type { default as Ajv } from "ajv";
import type { Plugin as ChassisPlugin } from "@earnest-labs/microservice-chassis/Plugin.js";
import type { PluginContext as ChassisPluginContext } from "@earnest-labs/microservice-chassis/PluginContext.js";
import type { Application as IApplication } from "@earnest/application-service-client/typings/codegen.js";
import type { HttpError as IHttpError } from "http-errors";

import type { Request, Response } from "express";

import type ContractExecutable from "contract/contract-executable.js";
import * as contractTypes from "contract/contract-types/index.js";
import type IContract from "contract/contract.js";
import type { ApplicationState, UserState } from "clients/redis/index.js";

import type {
  default as IExecutable,
  ExecutableInterface as IExecutableInterface,
  ExecutionContext as IExecutionContext,
  ExecutableParent as IExecutableParent,
} from "contract/executable.js";

import type {
  default as Manifest,
  ContractManifest as IContractManifest,
  ContractManifests as IContractManifests,
} from "contract/manifest.js";

type HandlebarsTemplate = ReturnType<
  ReturnType<typeof createJsonHandlebars>["compile"]
>;

type IExecutions<
  M extends { [key: string]: IContract<unknown> | IContract<unknown>[] },
> = Map<keyof M, unknown>;

/**
 * TODO: fully define this shape
 */
type IContractInput<I> = I & {
  applicationState: ApplicationState;
  request?: Request;
  response?: Response;
  env?: { [key: string]: string };
  manifestName?: string;
  userState?: UserState;
  manifest?: Manifest<I>;
  auth?: {
    /**
     * A list of all auth strategies that have been successfully validated
     */
    strategies: string[];
    /**
     * The request has elevated internal privileges
     */
    isInternal: boolean;
    /**
     * At least one set of recognized credentials included in the request
     * are valid (formatting, expiration, verification, etc)
     */
    isValid: boolean;
    /**
     * The provided credentials have sufficient privilege to affect the resources
     */
    isAuthorized: boolean;
    /**
     * Artifacts related to any authentication strategies used
     */
    artifacts?: {
      [key: string]: undefined | string | number;
      userId?: string;
      candidateId?: string;
      emailId?: string;
      exp?: number;
    };
  };
};

/**
 * TODO: fully define this shape
 */
type IContractOutput = unknown;

interface IContracts<I> {
  [key: string]: {
    [version: string]: IContract<I>;
  };
}
type ISchema = { [key: string]: unknown };
type ISchemas = {
  [key: string]: ISchema;
};

interface IEvaluations {
  [key: string]:
    | ContractExecutable<unknown, unknown, unknown>
    | ContractExecutable<unknown, unknown, unknown>[];
}

type IExecutionInjections<I> = IContractInput<I> & {
  context: ChassisPluginContext;
  manifest: Manifest<I>;
  contract?: ContractExecutable<unknown, unknown, unknown>;
  // All known contract instances by key
  evaluations: IEvaluations;
};

import "contract/manifest.js";
declare module "contract/manifest.js" {
  type Contract<I> = IContract<I>;
  type Contracts<I> = IContracts<I>;
  type Executables<I> = Record<
    string,
    IContract<I> | IContract<I>[] | Manifest<I> | Manifest<I>[]
  >;
}

import "contract/ingestor.js";
declare module "contract/ingestor.js" {
  type Contracts<I> = IContracts<I>;

  type ContractType = Exclude<keyof typeof contractTypes, "ContractType">;

  type Schema = ISchema;
  type Schemas = ISchemas;
  interface BuildContracts {
    (context: ChassisPluginContext, path: string): Promise<Contracts<unknown>>;
  }

  interface BuildSchemas {
    (
      context: ChassisPluginContext,
      path: string,
    ): Promise<{ totalSchemas: number; schemas: Schemas }>;
  }
  interface IngestManifest {
    (
      context: ChassisPluginContext,
    ): Promise<{ contracts: Contracts<unknown>; manifests: Manifests }>;
  }
}

import type { Dependencies as IDependencies } from "contract/executable.js";
declare module "contract/contract-executable.js" {
  type Input<I> = IContractInput<I>;
  type Dependencies<I> = IDependencies<I>;
  type ExecutableInterface<I> = IExecutableInterface<IContractInput<I>>;
  type ExecutionContext<I> = IExecutionContext<IContractInput<I>>;
}

declare module "contract/contract.js" {
  type Context = ChassisPluginContext;
  type ExecutionContext<I> = IExecutionContext<IContractInput<I>>;
  type Input<I> = IContractInput<I>;

  type ContstructorArguments = {
    key?: string;
    version?: string;
    folders?: string[];
    type?: string;
    raw: string;
  };

  type ContractType = Exclude<keyof typeof contractTypes, "ContractType">;

  type Template = HandlebarsTemplate;
  type ContextualManifest<I> = Manifest<I>;
  type Executions<I> = IExecutions<{
    [key: string]: Contract<I> | Contract<I>[];
  }>;
  type ExecutableInterface<I> = IExecutableInterface<IContractInput<I>>;
}

type ContractPlugin = ChassisPlugin<{
  Manifest: typeof Manifest;
  Contract: typeof IContract;
  manifests: IContractManifests;
  contracts: IContracts<unknown>;
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
    errors: Record<string, Array<Error | IHttpError>>;
    manifest: Manifest<unknown>;
    input: IContractInput<{ application: Application | null }>;
    contract: IContractOutput;
    evaluations: Record<string, ContractExecutable<unknown, unknown>>;
  }
}
