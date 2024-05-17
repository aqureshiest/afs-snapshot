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
    this.expiration = Number(redisExpiration);
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

  async getApplicationState(
    context: PluginContext, // eslint-disable-line @typescript-eslint/no-unused-vars
    appID: string,
    value, // eslint-disable-line @typescript-eslint/no-unused-vars
  ): Promise<ApplicationState> {
    const stringValue = await this.client.get(`${this.prefix}_app_${appID}`);
    let parsed = {};
    if (stringValue && stringValue !== null) {
      try {
        parsed = JSON.parse(stringValue);
      } catch (ex) {
        context.logger.error(ex);
      }
    }
    return parsed;
  }

  /* eslint-disable-next-line @typescript-eslint/no-unused-vars */
  async setApplicationState(context: PluginContext, appID: string, value) {
    const rKey = `${this.prefix}_app_${appID}`;
    const res = await this.client.set(rKey, JSON.stringify(value), {
      EX: this.expiration,
      GT: true,
    });
    return res;
  }

  async getUserState(
    context: PluginContext, // eslint-disable-line @typescript-eslint/no-unused-vars
    key: string,
    value, // eslint-disable-line @typescript-eslint/no-unused-vars
  ): Promise<UserState> {
    const userStateValue = await this.client.get(`${this.prefix}_usr_${key}`);
    let parsed = {};
    if (userStateValue && userStateValue !== null) {
      try {
        parsed = JSON.parse(userStateValue);
      } catch (ex) {
        context.logger.error(ex);
      }
    }
    return parsed;
  }

  async setUserState(context: PluginContext, key: string, value) {
    const currentState = await this.getUserState(context, key, null);
    const newState = {
      ...currentState,
      ...value,
    };
    const rKey = `${this.prefix}_usr_${key}`;
    return await this.client.set(rKey, JSON.stringify(newState), {
      EX: this.expiration,
      GT: true,
    });
  }
}
