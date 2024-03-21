import type { PluginContext } from "@earnest-labs/microservice-chassis/PluginContext.js";

declare module "api/auth/index.ts" {
  type Context = PluginContext;
}

declare module "api/auth/strategies/session.js" {
  type Context = PluginContext;
}
