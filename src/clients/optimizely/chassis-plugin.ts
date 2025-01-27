import Plugin from '@earnest-labs/microservice-chassis/Plugin.js';
import PluginContext from '@earnest-labs/microservice-chassis/PluginContext.js';
import SensitiveString from '@earnest-labs/ts-sensitivestring';

import OptimizelyClient from './client.js';

export const plugin: Plugin<OptimizelyClient> = {
  name: 'optimizelyClient',
  version: '1.0.0',
  registerOrder: 0,
  register: async (context: PluginContext) => {
    const key =
      SensitiveString.ExtractRequiredValue(context.env.OPTIMIZELY_SDK_KEY) ||
      '';

    plugin.instance = new OptimizelyClient(context, key);
  },
};
