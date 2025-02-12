import type { Plugin as ChassisPlugin } from "@earnest-labs/microservice-chassis/Plugin.js";
import type { PluginContext as ChassisPluginContext } from "@earnest-labs/microservice-chassis/PluginContext.js";
import * as types from "@earnest/application-service-client/typings";
import type { Application as IApplication } from "@earnest/application-service-client/typings/codegen.js";

export interface ApplicationServiceClient {
  /* eslint-disable  @typescript-eslint/no-explicit-any */
  eventInputTypes: { [key: string]: object };
  sendRequest(
    body: types.GqlRequestBody,
    ...injections: any[]
  ): Promise<unknown>;
  getEventInputTypes(query: string, ...injections: any[]): Promise<void>;
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
  type Application = IApplication;
}

declare module "clients/application-service/index.js" {
  type Application = IApplication;
}
