import type { PluginContext as ChassisPluginContext } from "@earnest-labs/microservice-chassis/PluginContext.js";
import { ExecutableParent as IExecutableParent } from "contract/executable.js";

import "contract/scope.js";
declare module "contract/scope.js" {
  type ExecutableParent = IExecutableParent;
  type PluginContext = ChassisPluginContext;
}
