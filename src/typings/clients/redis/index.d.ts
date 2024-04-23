import type { Plugin as ChassisPlugin } from "@earnest-labs/microservice-chassis/Plugin.js";

import RedisClient from "clients/redis/index.js";
type RedisChassisPlugn = ChassisPlugin<RedisClient>;

declare module "@earnest-labs/microservice-chassis/PluginContext.js" {
  interface LoadedPlugins {
    redis: RedisChassisPlugn;
  }
}
declare module "clients/redis/index.js" {
  // cloned from Plaid SDK
  type ApplicationStep = {
    manifest: string;
    step?: string;
  } | null;
  type ManifestState = {
    sixMonthResidence?: boolean;
    employmentType?: string;
    addAddtionalIncome?: boolean;
    hasConsistentIncome?: boolean;
  };
}
