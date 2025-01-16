import type { Plugin as ChassisPlugin } from "@earnest-labs/microservice-chassis/Plugin.js";
import type { PluginContext as ChassisPluginContext } from "@earnest-labs/microservice-chassis/PluginContext.js";

import type { HttpError as IHttpError } from "http-errors";

import type { default as PartnerClient } from "clients/partner/index.js";
type PartnerClientPlugin = ChassisPlugin<PartnerClient>;

import { Input as IContractInput } from "contract/manifest.js";

declare module "@earnest-labs/microservice-chassis/PluginContext.js" {
  interface LoadedPlugins {
    partnerClient: PartnerClientPlugin;
  }
}

declare module "clients/partner/chassis-plugin.ts" {
  type Plugin = ChassisPlugin;
  type Context = ChassisPluginContext;
  type instance = PartnerClient;
}

declare module "../../../clients/partner/index.js" {
  /**
   * TODO: use this interface for the `CalculatorRequest` contract type to ensure consistent
   * interface for error handling / reporting
   */
  interface NotificationRequestMethod<U = unknown, O = unknown> {
    (
      this: PartnerClient,
      input: Input<unknown>,
      context: ChassisPluginContext,
      payload: U,
    ): Promise<{ errors: Array<Error | IHttpError>; results?: O }>;
  }

  type Input<I> = IContractInput;
  type HttpError = IHttpError;
  type AttributionEventRequest = {
    user_id?: string;
    application_id: string;
    // source, referral_codes and device_id may be made required in the handler,
    // depending on the value of attributionEventPath
    device_id?: string;
    referral_codes?: Array<string>;
    misc?: {
      click_id?: string;
      email?: string;
    };
  };
  type AttributionEventResponse = {
    id: number;
    device_id?: string;
    event: AttributionConversionEvent;
    user_id: string;
    pre_application_id?: number;
    application_id: string;
    created_at: string;
    misc: {
      click_id: string;
      email: string;
    };
    source: string;
  };
  enum AttributionConversionEvent {
    "SLR_QS" = "SLR_QS",
    "APPLICATION_SUBMIT" = "APPLICATION_SUBMIT",
  }
  enum AttributionConversionEventPath {
    "SLR_QS" = "student-refi-quick-score",
    "APPLICATION_SUBMIT" = "application-submit",
  }
}
