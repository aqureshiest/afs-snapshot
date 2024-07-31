import type { Plugin as ChassisPlugin } from "@earnest-labs/microservice-chassis/Plugin.js";
import type { PluginContext as ChassisPluginContext } from "@earnest-labs/microservice-chassis/PluginContext.js";
import type { Application as IApplication } from "@earnest/application-service-client/typings/codegen.js";
import type { HttpError as IHttpError } from "http-errors";

import type { ApplicationState, UserState } from "clients/redis/index.js";
import type IManifest from "contract/manifest.js";
import type Contract from "contract/contract.js";
import type Executable from "contract/executable.js";

interface IDependencies<Input> {
  [key: string]: Executable<Input>;
}

/**
 *
 */
interface IExecutableInterface<Input> {
  input(
    pluginContext: ChassisPluginContext,
    executionContext: IExecutionContext<Input>,
    input: Input,
  ): Executable<Input>;
  execute(
    pluginContext: ChassisPluginContext,
    executionContext: IExecutionContext<Input>,
    input: Input,
  ): Promise<Executable<Input>>;
}

interface IExecutableParent<Input> {
  id: string;
  input(
    pluginContext: ChassisPluginContext,
    executionContext: IExecutionContext<Input>,
    input: Input,
  ): Executable<Input>;
  execute(
    pluginContext: ChassisPluginContext,
    executionContext: IExecutionContext<Input>,
    input: Input,
  ): Promise<unknown>;
}

interface IExecutableArgs<Input, Results extends unknown[]> {
  id: string;
  index?: number;
  parent: IExecutableParent<Input>;
  results?: Results;
  dependencies?: IDependencies<Input>;
  dependents?: IDependencies<Input>;
  evaluations?: IEvaluations<Input>;
}

interface IEvaluations<I> {
  [key: string]: Executable<I> | Array<Executable<I>>;
}

interface IExecutionContext<Input> {
  /**
   * When present, indicates the top-level manifest
   */
  manifest?: IManifest<Input>;
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
  self?: Executable<Input>;

  dependents?: IDependencies<Input>;
  dependencies?: IDependencies<Input>;

  // All known contract instances by key
  evaluations?: IEvaluations<Input>;
  errors?: {
    [key: string]: Array<Error | IHttpError>;
  };
}

declare module "contract/executable.js" {
  type PluginContext = ChassisPluginContext;
  type ExecutionContext<Input> = IExecutionContext<Input>;
  type Dependencies<Input> = IDependencies<Input>;
  type ExecutableInterface<Input> = IExecutableInterface<Input>;
  type ExecutableArgs<Input, Results extends unknown[]> = IExecutableArgs<
    Input,
    Results
  >;
  type ExecutableParent<Input> = IExecutableParent<Input>;
  type HttpError = IHttpError;
  type Evaluations<I> = IEvaluations<I>;
}

declare module "contract/manifest-execution.js" {
  type ExecutableArgs<Input, Results extends unknown[]> = IExecutableArgs<
    Input,
    Results
  >;
  type Manifest<Input> = IManifest<Input>;
  type PluginContext = ChassisPluginContext;
  type ExecutionContext = IExecutionContext<unknown>;
  type Evaluations<I> = IEvaluations<I>;
}

declare module "contract/manifest.js" {
  type ExecutableParent<Input> = IExecutableParent<Input>;
}

declare module "contract/contract.js" {
  type ExecutableParent<Input> = IExecutableParent<Input>;
}

declare module "contract/contract-executable.js" {
  type ExecutableParent<Input> = IExecutableParent<Input>;
}
