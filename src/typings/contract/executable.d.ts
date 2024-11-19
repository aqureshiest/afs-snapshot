import type { Plugin as ChassisPlugin } from "@earnest-labs/microservice-chassis/Plugin.js";
import type { PluginContext as ChassisPluginContext } from "@earnest-labs/microservice-chassis/PluginContext.js";
import type { Application as IApplication } from "@earnest/application-service-client/typings/codegen.js";
import type { HttpError as IHttpError } from "http-errors";

import type { ApplicationState, UserState } from "clients/redis/index.js";
import type IManifest from "contract/manifest.js";
import type Contract from "contract/contract.js";
import type Executable from "contract/executable.js";

interface IDependencies {
  [key: string]: Executable;
}

/**
 *
 */
interface IExecutableInterface {
  id: string;
  input(
    pluginContext: ChassisPluginContext,
    input: unknown,
    scope?: Executable,
  ): Executable;
  execute(
    pluginContext: ChassisPluginContext,
    input: unknown,
    scope?: Executable,
  ): Promise<unknown | void>;
}

type IExecutableParent = IManifest | Contract;

interface IExecutableArgs<Results extends unknown[]> {
  id: string;
  key?: string;
  index?: number;
  sync?: boolean;
  parent: IManifest | Contract;
  results?: Results;

  scope?: Executable;

  dependencies?: IDependencies;
  dependents?: IDependencies;
  evaluations?: IEvaluations;
  executables?: Record<string, IExecutableParent>;
  errors?: Record<string, Array<Error | IHttpError>>;
}

interface IEvaluations {
  [key: string]: Executable | Array<Executable>;
}

interface IExecutionContext {
  /**
   * When present, indicates the top-level manifest
   */
  manifest?: IManifest;
  /**
   * When present, indicates which executable
   */
  key?: string;
  /**
   * When present, indicates which index of a
   */
  index?: number;
  /**
   * When present, indicates the executable targeted by the above
   */
  self?: Executable;

  dependents?: IDependencies;
  dependencies?: IDependencies;

  // All known contract instances by key
  evaluations?: IEvaluations;
  errors?: {
    [key: string]: Array<Error | IHttpError>;
  };
}

declare module "contract/executable.js" {
  type PluginContext = ChassisPluginContext;
  type ExecutionContext = IExecutionContext;
  type Dependencies = IDependencies;
  type ExecutableInterface = IExecutableInterface;
  type ExecutableArgs<Results extends unknown[]> = IExecutableArgs<Results>;
  type ExecutableParent = IExecutableParent;
  type ExecutableParents = Record<string, IExecutableParent>;
  type HttpError = IHttpError;
  type Evaluations = IEvaluations;
}

declare module "contract/manifest-execution.js" {
  type ExecutableArgs<Results extends unknown[]> = IExecutableArgs<Results>;
  type Manifest = IManifest;
  type PluginContext = ChassisPluginContext;
  type ExecutionContext = IExecutionContext;
  type Evaluations = IEvaluations;
  type ExecutableParents = Record<string, IExecutableParent>;
}

declare module "contract/manifest.js" {
  type ExecutableParent = IExecutableParent;
}

declare module "contract/contract.js" {
  type ExecutableParent = IExecutableParent;
}

declare module "contract/contract-executable.js" {
  type ExecutableParent = IExecutableParent;
}
