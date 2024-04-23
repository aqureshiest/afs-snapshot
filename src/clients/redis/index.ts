import PluginContext from "@earnest-labs/microservice-chassis/PluginContext.js";

import { createCluster, createClient } from "redis";

export default class RedisClient {
  baseUrl;
  prefix;
  client;
  type;
  port;
  expiration;

  constructor(context: PluginContext) {
    const redisBaseUrl = context.env.REDIS_BASE_URL;
    const redisPrefix = context.env.REDIS_PREFIX;
    const redisExpiration = context.env.REDIS_KEY_EXPIRATION;
    const redisPort = context.env.REDIS_PORT;
    const redisType = context.env.REDIS_TYPE;
    if (!redisBaseUrl || !redisPrefix) {
      const error = new Error("[ee80d106] unable to load Redis configuration");
      context.logger.error(error);
      throw error;
    }
    this.port = redisPort;
    this.type = redisType;
    this.baseUrl = redisBaseUrl;
    this.prefix = redisPrefix;
    this.expiration = redisExpiration;
  }

  async connect(context) {
    if (this.type == "cluster") {
      this.client = await createCluster({
        rootNodes: [
          {
            url: `redis://${this.baseUrl}:${this.port}/0`,
          },
        ],
      });
    } else {
      this.client = await createClient({
        url: `redis://${this.baseUrl}:${this.port}/0`,
      });
    }
    this.client.on("error", (err) => {
      context.logger.error(err);
    });
    return this.client.connect().then(() => {
      context.logger.info("Redis connected");
    });
  }
  async disconnect() {
    this.client.disconnect();
  }

  async getApplicationStep(
    context: PluginContext, // eslint-disable-line @typescript-eslint/no-unused-vars
    appID: string,
    value, // eslint-disable-line @typescript-eslint/no-unused-vars
  ): Promise<ApplicationStep> {
    const stringValue = await this.client.get(
      `${this.prefix}_appstep_${appID}`,
    );
    if (stringValue) {
      return JSON.parse(stringValue);
    } else {
      return null;
    }
  }

  /* eslint-disable-next-line @typescript-eslint/no-unused-vars */
  async setApplicationStep(context: PluginContext, appID: string, value) {
    const res = await this.client.set(
      `${this.prefix}_appstep_${appID}`,
      JSON.stringify(value),
      {
        EX: this.expiration,
        GT: true,
      },
    );
    return res;
  }

  async getManifestState(
    context: PluginContext, // eslint-disable-line @typescript-eslint/no-unused-vars
    manifest: string,
    value, // eslint-disable-line @typescript-eslint/no-unused-vars
  ): Promise<ManifestState> {
    const manifestStateValue = await this.client.get(
      `${this.prefix}_manstate_${manifest}`,
    );
    return JSON.parse(manifestStateValue);
  }

  async setManifestState(context: PluginContext, manifest: string, value) {
    const currentState = await this.getManifestState(context, manifest, null);
    const newState = {
      ...currentState,
      ...value,
    };
    return this.client.set(
      `${this.prefix}_manstate_${manifest}`,
      JSON.stringify(newState),
      {
        EX: this.expiration,
        GT: true,
      },
    );
  }
}
