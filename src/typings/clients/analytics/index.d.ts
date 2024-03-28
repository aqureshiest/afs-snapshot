import type { Plugin as ChassisPlugin } from "@earnest-labs/microservice-chassis/Plugin.js";
import type { PluginContext as ChassisPluginContext } from "@earnest-labs/microservice-chassis/PluginContext.js";
import AnalyticsServiceClient from "clients/analytics/index.js";
type AnalyticsServicePlugin = ChassisPlugin<AnalyticsServiceClient>;

declare module "@earnest-labs/microservice-chassis/PluginContext.js" {
  interface LoadedPlugins {
    analyticsServiceClient: AnalyticsServicePlugin;
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
  traits: BaseEventProperties;
}

interface ITrackEvent extends IEvent {
  event: string;
  properties: BaseEventProperties;
}

interface IPageEvent extends IEvent {
  properties: BaseEventProperties;
}

interface BaseEventProperties {
  product: "SLR";
  product_subtype: ApplicationType;
  initiator: UserRole;
  role: UserRole;
  section: string;
  "Has no identifying info"?: "true";
}

declare module "../../../clients/analytics/index.js" {
  type AnalyticsEvent = IEvent;
  type IdentifyAnalyticsEvent = IIdentifyEvent;
  type TrackAnalyticsEvent = ITrackEvent;
  type PageAnalyticsEvent = IPageEvent;
}
