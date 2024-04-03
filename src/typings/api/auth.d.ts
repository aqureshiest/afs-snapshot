import type { PluginContext } from "@earnest-labs/microservice-chassis/PluginContext.js";
import { HttpError } from "http-errors";
import { NeasClaims } from "../clients/NEAS/index.js";

declare module "api/auth/index.ts" {
  type Context = PluginContext;
}

type NeasArtifacts = NeasClaims;

type StrategyResponse = {
  artifacts: {
    session: NeasArtifacts;
  } | null;
  error: HttpError | Error | null;
};

declare module "api/auth/strategies/session.js" {
  type Context = PluginContext;
  type Strategy = StrategyResponse;
}
