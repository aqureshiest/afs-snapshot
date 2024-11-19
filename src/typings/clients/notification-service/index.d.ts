import type { Plugin as ChassisPlugin } from "@earnest-labs/microservice-chassis/Plugin.js";
import type { PluginContext as ChassisPluginContext } from "@earnest-labs/microservice-chassis/PluginContext.js";

import type { HttpError as IHttpError } from "http-errors";

import type { default as NotificationServiceClient } from "clients/notification-service/index.js";
type NotificationServicePlugin = ChassisPlugin<NotificationServiceClient>;

import { Input as IContractInput } from "contract/manifest.js";

declare module "@earnest-labs/microservice-chassis/PluginContext.js" {
  interface LoadedPlugins {
    notificationServiceClient: NotificationServicePlugin;
  }
}

declare module "clients/notification-service/chassis-plugin.ts" {
  type Plugin = ChassisPlugin;
  type Context = ChassisPluginContext;
  type instance = NotificationServiceClient;
}

declare module "../../../clients/notification-service/index.js" {
  /**
   * TODO: use this interface for the `CalculatorRequest` contract type to ensure consistent
   * interface for error handling / reporting
   */
  interface NotificationRequestMethod<U = unknown, O = unknown> {
    (
      this: NotificationServiceClient,
      input: Input<unknown>,
      context: ChassisPluginContext,
      payload: U,
    ): Promise<{ errors: Array<Error | IHttpError>; results?: O }>;
  }

  type Input<I> = IContractInput<I>;
  type HttpError = IHttpError;
}
