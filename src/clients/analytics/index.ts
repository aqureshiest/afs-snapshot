import { Analytics } from "@segment/analytics-node";
import PluginContext from "@earnest-labs/microservice-chassis/PluginContext.js";
import { ApplicationSectionStartedEvent, Event } from "./events.js";
import { ApplicationSectionStartedParams } from "./types.js";

export default class AnalyticsServiceClient {
  private client: Analytics;
  private logger: PluginContext["logger"];

  constructor(context: PluginContext, apiKey: string) {
    this.client = new Analytics({ writeKey: apiKey });

    if (context.logger != null) {
      this.logger = context.logger;
    }
  }

  track(event: Event) {
    try {
      this.client.track(event);
      this.logger.info(this.analyticsLog(event));
    } catch (e) {
      this.logger.error(this.analyticsErrorLog(e, event));
    }
  }

  identify(event: Event) {
    try {
      this.client.identify(event);
      this.logger.info(this.analyticsLog(event));
    } catch (e) {
      this.logger.error(this.analyticsErrorLog(e, event));
    }
  }

  trackApplicationSectionStarted(parameters: ApplicationSectionStartedParams) {
    const event = new ApplicationSectionStartedEvent(parameters);
    return this.track(event);
  }

  analyticsLog({ event, anonymousId, userId }: Event) {
    return {
      event,
      anonymousId,
      user: {
        id: userId,
      },
      userAgent: null,
      analyticsTag: "analytics-event",
    };
  }

  analyticsErrorLog(error: Error, { event, anonymousId, userId }: Event) {
    return {
      error,
      event,
      anonymousId,
      user: {
        id: userId,
      },
      userAgent: null,
      analyticsTag: "analytics-error",
    };
  }
}
