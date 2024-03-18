import type { Plugin as ChassisPlugin } from "@earnest-labs/microservice-chassis/Plugin.js";
import type { PluginContext as ChassisPluginContext } from "@earnest-labs/microservice-chassis/PluginContext.js";
import AnalyticsServiceClient from "clients/analytics/index.js";
type AnalyticsServicePlugin = ChassisPlugin<AnalyticsServiceClient>;

declare module "@earnest-labs/microservice-chassis/PluginContext.js" {
  interface LoadedPlugins {
    analyticsTokenServiceClient: AnalyticsServicePlugin;
  }
}

declare module "clients/analytics/chassis-plugin.ts" {
  type Plugin = ChassisPlugin;
  type Context = ChassisPluginContext;
  type instance = AnalyticsServiceClient;
}

type ApplicationType = "primary-only" | "with-cosigner" | "parent";
type UserRole = "primary" | "cosigner";

interface IEvent {
  userId?: string;
  anonymousId: string;
  timestamp?: Date;
  context?: { [key: string]: string };
}

interface IIdentifyEvent extends IEvent {
  traits: BaseTrackEventProperties;
}

interface ITrackEvent extends IEvent {
  event: string;
  properties: BaseTrackEventProperties;
}

interface BaseTrackEventProperties {
  product: "SLR";
  product_subtype: ApplicationType;
  initiator: UserRole;
  flowVariation: string;
  role: UserRole;
  section: string;
  "Has no identifying info"?: "true";
}

declare module "../../../clients/analytics/index.js" {
  type Event = IEvent;
  type IdentifyEvent = IIdentifyEvent;
  type AnalyticsTrackEvent = ITrackEvent;
}
