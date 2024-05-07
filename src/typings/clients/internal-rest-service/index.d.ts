import type { Plugin as ChassisPlugin } from "@earnest-labs/microservice-chassis/Plugin.js";
import type { PluginContext as ChassisPluginContext } from "@earnest-labs/microservice-chassis/PluginContext.js";

import InternalRestServiceClient from "clients/internal-rest-service/client.js";
type InternalRestServicePlugin = ChassisPlugin<InternalRestServiceClient>;

declare module "@earnest-labs/microservice-chassis/PluginContext.js" {
  interface LoadedPlugins {
    internalRestServiceClient: InternalRestServicePlugin;
  }
}

declare module "clients/internal-rest-service/chassis-plugin.js" {
  type Context = ChassisPluginContext;
  type Plugin = InternalRestServicePlugin;
}
