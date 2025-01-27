import OptimizelySDK from '@optimizely/optimizely-sdk';
import PluginContext from '@earnest-labs/microservice-chassis/PluginContext.js';
import Client from '../client.js';

export enum FeatureFlagKey {
  /* The following have been set up in Optimizely: */
  // https://app.optimizely.com/v2/projects/5731925864742912/flags/manage/cis_person/rules/development
  CIS_PERSON = 'cis_person',
}

export default class OptimizelyClient extends Client {
  private logger: PluginContext['logger'];
  public sdkKey: string;

  constructor(context: PluginContext, sdkKey: string) {
    const options = { baseUrl: 'baseUrl' };
    super(options);
    this.sdkKey = sdkKey;
    this.logger = context.logger;
  }

  public createInstance(): OptimizelySDK.Client {
    if (!this.sdkKey) {
      const error = new Error('[4134f35a] no sdk key found');
      this.logger.error({
        error,
        message: error.message,
      });
      throw error;
    }

    try {
      const optimizely = OptimizelySDK.createInstance({
        sdkKey: this.sdkKey,
        datafileOptions: {
          autoUpdate: true,
          updateInterval: 60 * 1000 * 10, // 10 minutes
        },
      });

      if (!optimizely) {
        throw new Error('[7719511a] Failed to create Optimizely SDK instance');
      }

      return optimizely;
    } catch (error) {
      this.logger.error({
        error,
        message: error.message,
      });
      throw error;
    }
  }

  public async getFeatureFlag(
    featureFlagKey: FeatureFlagKey,
    userId: string = '0',
    attributes: OptimizelySDK.UserAttributes = {}
  ): Promise<boolean> {
    try {
      const optimizelySDK = this.createInstance();
      await optimizelySDK.onReady();
      return optimizelySDK.isFeatureEnabled(featureFlagKey, userId, attributes);
    } catch (error) {
      this.logger.error({
        error,
        message: error.message,
        featureFlag: featureFlagKey,
      });

      throw error;
    }
  }
}
