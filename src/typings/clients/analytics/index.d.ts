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

interface IEvent {
  userId: string;
  timestamp?: Date;
  context?: { [key: string]: string };
}

interface IIdentifyEvent extends IEvent {
  traits: BaseEventProperties;
}

interface ITrackEvent extends IEvent {
  event: string;
  properties: BaseEventProperties & {
    section: string;
    loan_type: string;
    source: string;
    step: string;
  };
}

interface IPageEvent extends IEvent {
  name: string;
  properties: BaseEventProperties & {
    source: string;
  };
}

interface BaseEventProperties {
  product: "SLR";
  applicationId: string;
}

declare module "../../../clients/analytics/index.js" {
  type AnalyticsEvent = IEvent;
  type IdentifyAnalyticsEvent = IIdentifyEvent;
  type TrackAnalyticsEvent = ITrackEvent;
  type PageAnalyticsEvent = IPageEvent;
}
