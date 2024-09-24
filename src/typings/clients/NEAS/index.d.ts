import type { Plugin as ChassisPlugin } from "@earnest-labs/microservice-chassis/Plugin.js";
import type { default as NeasClient } from "clients/NEAS/index.js";
import type { Client } from "@earnest/http";
import { IExecutionInjections } from "typings/contract/index.js";
import { Input as IContractInput } from "contract/manifest.js";

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

export type NeasUserIdMap = {
  userIdMap: {
    uuid: string;
    cognito_ref_id: string;
    user_id: string;
    unauthenticated_id: string;
    email_id: string;
    created_at: string;
    updated_at: string;
    monolith_user_ref_id: string;
    cin_ref_id: string;
    gm_account_ref_id: string;
    user_ref_id: string;
  };
};

declare module "clients/NEAS/index.js" {
  type Claims = NeasClaims;
  type UserIDs = NeasUserIdMap;
  type ClientResponse<T> = Client.Response<T>;
  type Input = IContractInput<unknown>;
}
