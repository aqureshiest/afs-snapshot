import type { PluginContext } from "@earnest-labs/microservice-chassis/PluginContext.js";
import { HttpError } from "http-errors";
import { NeasClaims } from "../clients/NEAS/index.js";

declare module "api/auth/index.ts" {
  type Context = PluginContext;
}

type StrategyResponse = {
  strategy: string;
  claims: NeasClaims | unknown | null;
  error: HttpError[];
};

declare module "api/auth/strategies/session.js" {
  type Context = PluginContext;
  type Strategy = StrategyResponse;
}

declare module "api/auth/strategies/internal.js" {
  type Context = PluginContext;
  type Strategy = StrategyResponse
}