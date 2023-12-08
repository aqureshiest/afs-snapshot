import type { Injections as IExecutionInjections } from "contract/manifest.js";

import "contract/template-helpers/contract.js";
declare module "contract/template-helpers/contract.js" {
  type Injections = IExecutionInjections;
}

import "contract/template-helpers/embedded.js";
declare module "contract/template-helpers/embedded.js" {
  type Injections = IExecutionInjections;
}

import "contract/template-helpers/list.js";
declare module "contract/template-helpers/list.js" {
  type Injections = IExecutionInjections;
}
