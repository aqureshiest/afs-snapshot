import type { Plugin as ChassisPlugin } from "@earnest-labs/microservice-chassis/Plugin.js";
import type { PluginContext as ChassisPluginContext } from "@earnest-labs/microservice-chassis/PluginContext.js";
import * as types from "@earnest/application-service-client/typings";
import * as codegen from "@earnest/application-service-client/typings/codegen.js";

export type Application = codegen.Application;
export interface ApplicationServiceClient {
  // /* eslint-disable  @typescript-eslint/no-explicit-any */
  sendRequest(body: types.GqlRequestBody, ...injections: any[]): unknown
}

type ApplicationServicePlugin = ChassisPlugin<ApplicationServiceClient>;

declare module "@earnest-labs/microservice-chassis/PluginContext.js" {
  interface LoadedPlugins {
    applicationServiceClient: ApplicationServicePlugin;
  }
}

declare module "clients/application-service/chassis-plugin.ts" {
  type Plugin = ChassisPlugin;
  type Context = ChassisPluginContext;
  type instance = ApplicationServiceClient;
}
