import { Timeout } from "@earnest/timing";
import PluginContext from "@earnest-labs/microservice-chassis/PluginContext.js";

import { createCluster, createClient } from "redis";
import type { RedisClientType, RedisClusterType, SetOptions } from "redis";

export default class RedisClient {
  baseUrl;
  prefix;
  client: RedisClientType | RedisClusterType;
  type;
  port;
  expiration;

  declare get: (RedisClientType | RedisClusterType)["get"];
  declare set: (RedisClientType | RedisClusterType)["set"];

  static RECONNECT_MAX_MS = 1000 * 60 * 5; // cap for exponential backoff
  static RECONNECT_FACTOR = 1.62; // factor for exponential backoff
  static CONNECTION_TIMEOUT = 1000; // maximum amount of time to wait for a hung connection

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
    context.logger.info(`Redis configuration: [expiration ${redisExpiration}]`);
    this.expiration = Number(redisExpiration);
  }

  async connect(context) {
    const url = `redis://${this.baseUrl}:${this.port}`;
    const config = {
      socket: {
        connectTimeout: RedisClient.CONNECTION_TIMEOUT,
        reconnectStrategy: function (retries) {
          const backoff = Math.floor(
            500 * Math.pow(RedisClient.RECONNECT_FACTOR, retries),
          );
          return Math.min(backoff, RedisClient.RECONNECT_MAX_MS);
        },
      },
    };

    if (this.type == "cluster") {
      this.client = await createCluster({
        rootNodes: [{ url }],
        useReplicas: true,
        defaults: config,
      });
    } else {
      this.client = await createClient({ url, ...config });
    }

    this.get = RedisClient.wrapClientMethod("get", context);
    this.set = RedisClient.wrapClientMethod("set", context);

    this.client.on("error", (err) => {
      context.logger.error({
        level: "error",
        message: "Redis error",
        error: {
          message: err.message,
          stack: err.stack,
        },
      });
    });

    return this.client.connect().then(() => {
      context.logger.info("Redis connected");
    });
  }

  async disconnect() {
    this.client.disconnect();
  }

  /**
   * Wraps a RedisClient or RedisCluster client instance method
   */
  static wrapClientMethod<M extends "get" | "set">(
    method: M,
    context: PluginContext,
  ) {
    return async function <
      A extends Parameters<(RedisClientType | RedisClusterType)[M]>,
    >(...args: A) {
      const timeout = new Timeout(
        RedisClient.CONNECTION_TIMEOUT,
        "Redis request timeout",
      );

      const redisRequest = this.client[method](...args);

      try {
        const redisResponse = await Promise.race([
          redisRequest,
          timeout.resolve(),
        ]);
        return redisResponse;
      } catch (error) {
        context.logger.log("error", {
          message: error.message,
          stack: error.stack,
        });
        throw error;
      }
    };
  }

  async getApplicationState(
    context: PluginContext, // eslint-disable-line @typescript-eslint/no-unused-vars
    appID: string,
    value, // eslint-disable-line @typescript-eslint/no-unused-vars
  ): Promise<ApplicationState> {
    const stringValue = await this.get(`${this.prefix}_app_${appID}`);
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
    const current = await this.getApplicationState(context, appID, null);

    if (
      !current ||
      current.manifest !== value.manifest ||
      current.step !== value.step
    ) {
      const res = await this.set(
        rKey,
        JSON.stringify({
          ...value,
          previous: { manifest: current?.manifest, step: current?.step },
        }),
        {
          EX: this.expiration,
          GT: true,
        } as SetOptions,
      );
      return res;
    }
    return null;
  }

  async getUserState(
    context: PluginContext, // eslint-disable-line @typescript-eslint/no-unused-vars
    key: string,
    value, // eslint-disable-line @typescript-eslint/no-unused-vars
  ): Promise<UserState> {
    const userStateValue = await this.get(`${this.prefix}_usr_${key}`);
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
    context.logger.info(
      `Setting user state: ${rKey} - ${Object.keys(newState).join(", ")}`,
    );
    try {
      return await this.set(rKey, JSON.stringify(newState), {
        EX: this.expiration,
        GT: true,
      } as SetOptions);
    } catch (ex) {
      context.logger.error("[14973763] error saving user state", ex);
      return null;
    }
  }
}
