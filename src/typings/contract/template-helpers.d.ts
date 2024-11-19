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

import type { default as Scope } from "contract/scope.js";

interface ITemplateData extends IExecutionContext {
  context: ChassisPluginContext;
  root: IContractInput;
  scope: IExecutable;
  self: IExecutable;
  ref: Scope<object>;
}

import type IContractExecutable from "contract/contract-executable.js";
import type { HelperOptions as IHelperOptions } from "handlebars";

interface ITemplateHelper<T extends unknown[] = []> {
  <I>(
    this: unknown,
    ...args: [...T, Omit<IHelperOptions, "data"> & { data: ITemplateData }] &
      unknown[]
  ): unknown;
}

import "contract/template-helpers/contract.js";
declare module "contract/template-helpers/contract.js" {
  type ExecutableParent<I> = IExecutableParent;
  type Executable<I> = IExecutable;
  type Contract<I> = IContract;
  type ContractType = IContractExecutable<unknown, unknown, unknown>;
  type TemplateHelper = ITemplateHelper;
  type TemplateData = ITemplateData;

  type Position = {
    line: number;
    column: number;
  };

  type HelperOptions = Omit<IHelperOptions, "data"> & {
    data: ITemplateData;
    loc: {
      start: Position;
      end: Position;
    };
  };
}

import "contract/template-helpers/log.js";
declare module "contract/template-helpers/log.js" {
  type TemplateHelper = ITemplateHelper;
  type HelperOptions = IHelperOptions & {
    data: ITemplateData;
  };
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

import "contract/template-helpers/json.js";
declare module "contract/template-helpers/json.js" {
  type TemplateHelper = ITemplateHelper;
}
import "contract/template-helpers/applicantById.js";
declare module "contract/template-helpers/applicantById.js" {
  type TemplateHelper = ITemplateHelper<
    [string, Array<{ [key: string]: unknown }>]
  >;
}

import "contract/template-helpers/raise.js";
declare module "contract/template-helpers/raise.js" {
  type TemplateHelper = ITemplateHelper<[string, number | undefined]>;
  type HelperOptions = IHelperOptions;
}
