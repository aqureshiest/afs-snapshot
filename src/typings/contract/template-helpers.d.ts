import type { Injections as IExecutionInjections } from "contract/manifest.js";
import type IContract from "contract/contract.js";
import type IContractType from "contract/contract-types/base-contract.js";
import type { HelperOptions } from "handlebars";

interface ITemplateHelper<T extends unknown[] = []> {
  (
    this: unknown,
    ...args: [
      ...T,
      Omit<HelperOptions, "data"> & { data: IExecutionInjections },
    ]
  ): unknown;
}

import "contract/template-helpers/contract.js";
declare module "contract/template-helpers/contract.js" {
  type Injections = IExecutionInjections;
  type Contract = IContract;
  type ContractType = IContractType<unknown, unknown, unknown>;
  type TemplateHelper = ITemplateHelper;
}

import "contract/template-helpers/embedded.js";
declare module "contract/template-helpers/embedded.js" {
  type Injections = IExecutionInjections;
  type TemplateHelper = ITemplateHelper;
}

import "contract/template-helpers/list.js";
declare module "contract/template-helpers/list.js" {
  type Injections = IExecutionInjections;
  type TemplateHelper = ITemplateHelper;
}

import "contract/template-helpers/obj.js";
declare module "contract/template-helpers/obj.js" {
  type Injections = IExecutionInjections;
  type TemplateHelper = ITemplateHelper;
}

import "contract/template-helpers/ajv.js";
declare module "contract/template-helpers/ajv.js" {
  type Injections = IExecutionInjections;
  type TemplateHelper = ITemplateHelper<[string, string, unknown]>;
}
