import type { PluginContext } from "@earnest-labs/microservice-chassis/PluginContext.js";
import { NeasClaims } from "../clients/NEAS/index.js";
import type { Locals as ILocals } from "express-serve-static-core";

declare module "api/auth/index.js" {
  type Context = PluginContext;
  type Locals = ILocals;
}

type StrategyResponse = {
  strategy: string;
  claims: NeasClaims | unknown | null;
};

declare module "api/auth/strategies/session.js" {
  type Context = PluginContext;
  type Strategy = StrategyResponse;
}

declare module "api/auth/strategies/internal.js" {
  type Context = PluginContext;
  type Strategy = StrategyResponse;
}
