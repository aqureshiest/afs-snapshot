import type { Plugin as ChassisPlugin } from "@earnest-labs/microservice-chassis/Plugin.js";
import type { default as NeasClient } from "clients/NEAS/index.js";
import type { Client } from "@earnest/http";
import { IExecutionInjections } from "typings/contract/index.js"

type NeasClientPlugin = ChassisPlugin<NeasClient>;

declare module "@earnest-labs/microservice-chassis/PluginContext.js" {
  interface LoadedPlugins {
    NeasClient: NeasClientPlugin;
  }
}

export type NeasClaims = {
  userId: string;
  exp: number;
  isValid: boolean;
};

declare module "clients/NEAS/index.js" {
  type Claims = NeasClaims;
  type ClientResponse<T> = Client.Response<T>;
  type Injections = IExecutionInjections;
}
