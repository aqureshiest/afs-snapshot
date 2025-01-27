import type { Plugin as ChassisPlugin } from '@earnest-labs/microservice-chassis/Plugin.js';
import type { PluginContext as ChassisPluginContext } from '@earnest-labs/microservice-chassis/PluginContext.js';

import OptimizelyClient from 'clients/optimizely/client.js';
type OptimizelyClientPlugin = ChassisPlugin<OptimizelyClient>;

declare module '@earnest-labs/microservice-chassis/PluginContext.js' {
  interface LoadedPlugins {
    optimizelyClient: OptimizelyClientPlugin;
  }
}

declare module 'clients/optimizely/chassis-plugin.js' {
  type Context = ChassisPluginContext;
  type Plugin = OptimizelyClientPlugin;
}
