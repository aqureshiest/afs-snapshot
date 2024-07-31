import type { PluginContext as ChassisPluginContext } from "@earnest-labs/microservice-chassis/PluginContext.js";
import type {
  default as IContract,
  Input as IContractInput,
} from "contract/contract.js";
import type {
  default as IExecutable,
  ExecutableInterface as IExecutableInterface,
  ExecutionContext as IExecutionContext,
  ExecutableParent as IExecutableParent,
} from "contract/executable.js";

interface ITemplateData<I> extends IExecutionContext<IContractInput<I>> {
  context: ChassisPluginContext;
  root: IContractInput<I>;
}

import type IContractExecutable from "contract/contract-executable.js";
import type { HelperOptions } from "handlebars";

interface ITemplateHelper<T extends unknown[] = []> {
  <I>(
    this: unknown,
    ...args: [...T, Omit<HelperOptions, "data"> & { data: ITemplateData<I> }] &
      unknown[]
  ): unknown;
}

import "contract/template-helpers/contract.js";
declare module "contract/template-helpers/contract.js" {
  type ExecutableParent<I> = IExecutableParent<IContractInput<I>>;
  type Executable<I> = IExecutable<IContractInput<I>>;
  type Contract<I> = IContract<I>;
  type ContractType = IContractExecutable<unknown, unknown, unknown>;
  type TemplateHelper = ITemplateHelper;
  type TemplateData = ITemplateData<unknown>;
}

import "contract/template-helpers/embedded.js";
declare module "contract/template-helpers/embedded.js" {
  type TemplateHelper = ITemplateHelper;
}

import "contract/template-helpers/list.js";
declare module "contract/template-helpers/list.js" {
  type TemplateHelper = ITemplateHelper;
}

import "contract/template-helpers/spread.js";
declare module "contract/template-helpers/spread.js" {
  type TemplateHelper = ITemplateHelper;
}

import "contract/template-helpers/obj.js";
declare module "contract/template-helpers/obj.js" {
  type TemplateHelper = ITemplateHelper;
}

import "contract/template-helpers/ajv.js";
declare module "contract/template-helpers/ajv.js" {
  type TemplateHelper = ITemplateHelper<[string, string, unknown]>;
}

import "contract/template-helpers/maskValue.js";
declare module "contract/template-helpers/maskValue.js" {
  type TemplateHelper = ITemplateHelper<[string, string]>;
}

import "contract/template-helpers/getSchool.js";
declare module "contract/template-helpers/getSchool.js" {
  type TemplateHelper = ITemplateHelper<
    [string, Array<{ [key: string]: unknown }>]
  >;
}

import "contract/template-helpers/map.js";
declare module "contract/template-helpers/map.js" {
  type RecursiveObject = {
    [K in string]: RecursiveObject;
  };

  type TemplateHelper = ITemplateHelper<[Array<RecursiveObject>, string]>;
}
