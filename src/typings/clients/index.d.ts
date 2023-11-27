import type { Plugin as ChassisPlugin } from "@earnest-labs/microservice-chassis/Plugin.js";
import type { PluginContext as ChassisPluginContext } from "@earnest-labs/microservice-chassis/PluginContext.js";
import ApplicationServiceClient from "../../clients/application-service/application-service.js"

import "../../clients/application-service/chassis-plugin.ts";
declare module "../../clients/application-service/chassis-plugin.ts" {
  type Plugin = ChassisPlugin
  type Context = ChassisPluginContext;
  type instance = ApplicationServiceClient;
}
