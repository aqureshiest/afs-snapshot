import type { RequestHandler as ExpressRequestHandler } from "express";
import type Manifest from "contract/manifest.js";
import type {
  default as Contract,
  Input as IContractInput,
  Executions as IExecutions,
} from "contract/contract.js";
import type { PluginContext as ChassisPluginContext } from "@earnest-labs/microservice-chassis/PluginContext.js";
import { BoundHandler as IBoundHandler } from "api/wrap-async-handler.js";

import type {
  ExecutableInterface as IExecutableInterface,
  ExecutionContext as IExecutionContext,
} from "contract/executable.js";
import type { ParameterFormat } from "contract/constants.js";

interface IParameter {
  key: string;
  /**
   * Either "uuid" or "integer" or some arbitrary regex
   */
  format?: ParameterFormat | string;
  /**
   * By default, all parameters are counted as optional, however any required
   * parameters must be preceded by required parameters
   */
  required?: boolean;
}

/**
 * TODO: define permissions
 */
interface IPermissions {
  [key: string]: unknown;
}

type IMethod = "get" | "post" | "put" | "patch" | "delete" | "use";

/**
 *
 */
interface IManifestContracts {
  [key: string]:
    | string
    | IManifestContracts
    | Array<string | IManifestContracts>;
}

/**
 *
 */
type IManifestJson = {
  methods?: IMethod[];
  permissions?: IPermissions;
  parameters?: IParameter[];
  /**
   *
   */
  inputs?: IManifestContracts;
  /**
   *
   */
  outputs: IManifestContracts;
};

type IContractManifest<I> = Manifest<I>;
type IContractManifests = Record<string, Record<IMethod, IManifestJson>>;

declare module "contract/manifest.js" {
  type ContractManifest<I> = IContractManifest<I>;
  type ContractManifests = IContractManifests;
  type Input<I> = IContractInput<I>;
  type Method = IMethod;
  type Permissions = IPermissions;
  type Parameter = IParameter;
  type ManifestContracts = IManifestContracts;
  type RequestHandler = ExpressRequestHandler;
  type BoundHandler = IBoundHandler;

  type Context = ChassisPluginContext;

  type ManifestJson = IManifestJson;
  type ExecutableInterface<I> = IExecutableInterface<IContractInput<I>>;
  type ExecutionContext<I> = IExecutionContext<IContractInput<I>>;
}

import "contract/manifest.test.js";
declare module "contract/manifest.test.js" {
  type Input<I> = IContractInput<I>;
  type Manifest<I> = IContractManifest<I>;
}

import "contract/ingestor.js";
declare module "contract/ingestor.js" {
  type ManifestJson = IManifestJson;
  type Manifest<I> = IContractManifest<I>;
  type Manifests = IContractManifests;
  type ManifestContracts = IManifestContracts;

  interface BuildManifests {
    (
      context: ChassisPluginContext,
      path: string,
      contracts: Contracts<unknown>,
    ): Promise<{ totalManifests: number; manifests: Manifests }>;
  }
}
