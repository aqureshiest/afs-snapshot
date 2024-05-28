import type { Plugin as ChassisPlugin } from "@earnest-labs/microservice-chassis/Plugin.js";

import RedisClient from "clients/redis/index.js";
type RedisChassisPlugn = ChassisPlugin<RedisClient>;

declare module "@earnest-labs/microservice-chassis/PluginContext.js" {
  interface LoadedPlugins {
    redis: RedisChassisPlugn;
  }
}
declare module "clients/redis/index.js" {
  type ApplicationState = {
    manifest?: string;
    step?: string;
    previous?: ApplicationState;
    [key: string]: unknown;
  } | null;
  type UserState = {
    sixMonthResidence?: boolean;
    employmentType?: string;
    addAddtionalIncome?: boolean;
    incomeIsConsistent?: boolean;
    [key: string]: unknown;
  };
}
