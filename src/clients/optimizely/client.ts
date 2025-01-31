import OptimizelySDK from "@optimizely/optimizely-sdk";
import PluginContext from "@earnest-labs/microservice-chassis/PluginContext.js";
import Client from "../client.js";

export enum FeatureFlagKey {
  /* The following have been set up in Optimizely: */
  // https://app.optimizely.com/v2/projects/5731925864742912/flags/manage/cis_person/rules/development
  CIS_PERSON = "cis_person",
}

export default class OptimizelyClient extends Client {
  private logger: PluginContext["logger"];

  private optimizelyClient: OptimizelySDK.Client;

  constructor(context: PluginContext, optimizelyClient: OptimizelySDK.Client) {
    const options = { baseUrl: "baseUrl" };
    super(options);
    this.logger = context.logger;
    this.optimizelyClient = optimizelyClient;
  }

  public async getFeatureFlag(
    featureFlagKey: string,
    userId: string = "0",
    attributes: OptimizelySDK.UserAttributes = {},
  ): Promise<boolean> {
    try {
      const result = this.optimizelyClient.isFeatureEnabled(
        featureFlagKey,
        userId,
        attributes,
      );
      return result;
    } catch (error) {
      this.logger.error({
        error,
        message: error.message,
        featureFlag: featureFlagKey,
      });

      throw error;
    }
  }

  public async getFeatureFlags(
    featureFlagKeys: { [key: string]: Array<string> },
    userId: string = "0",
    attributes: OptimizelySDK.UserAttributes = {},
  ): Promise<{ [key: string]: boolean }> {
    this.logger.debug({
      message: `[1c1c971d] DEBUG featureFlagKeys ${JSON.stringify(featureFlagKeys, null, 2)}`,
    });
    const { flags } = featureFlagKeys;
    const features = {};
    try {
      flags.forEach(async (featureFlag) => {
        const result = this.optimizelyClient.isFeatureEnabled(
          featureFlag,
          userId,
          attributes,
        );
        features[featureFlag] = result;
      });
      this.logger.debug({
        message: `[10de0e81] DEBUG features ${JSON.stringify(features, null, 2)}`,
      });
      return features;
    } catch (error) {
      this.logger.error({
        error,
        message: error.message,
      });

      throw error;
    }
  }
}
