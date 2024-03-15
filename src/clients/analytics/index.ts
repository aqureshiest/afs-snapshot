import { Analytics } from "@segment/analytics-node";
import PluginContext from "@earnest-labs/microservice-chassis/PluginContext.js";
import {
  ApplicationSectionStartedTrackEvent,
  TrackEvent,
  IdentifyEvent,
} from "./events.js";
import { ApplicationSectionStartedTrackParams } from "./types.js";

export default class AnalyticsServiceClient {
  private client: Analytics;
  private logger: PluginContext["logger"];

  constructor(context: PluginContext, apiKey: string) {
    if (!apiKey) {
      const error = new Error("no apiKey found");
      context.logger.error({
        error,
        message: error.message,
      });
      throw error;
    }

    this.client = new Analytics({ writeKey: apiKey });

    if (context.logger != null) {
      this.logger = context.logger;
    }
  }

  async track(event: TrackEvent) {
    return new Promise((resolve, reject) => {
      try {
        this.client.track(event, (err, ctx) => {
          if (err) {
            reject(err);
          }
          this.logger.info({ ...event, analyticsTag: "track-analytics-event" });
          resolve(ctx);
        });
      } catch (e) {
        this.logger.error({
          error: e,
          ...event,
          analyticsTag: "track-analytics-error",
        });
        reject(e);
      }
    });
  }

  identify(event: IdentifyEvent) {
    return new Promise((resolve, reject) => {
      try {
        this.client.identify(event, (err, ctx) => {
          if (err) {
            reject(err);
          }
          this.logger.info({
            ...event,
            analyticsTag: "identify-analytics-event",
          });
          resolve(ctx);
        });
      } catch (e) {
        this.logger.error({
          error: e,
          ...event,
          analyticsTag: "identify-analytics-error",
        });
        reject(e);
      }
    });
  }

  async trackApplicationSectionStarted(
    parameters: ApplicationSectionStartedTrackParams,
  ) {
    const event = new ApplicationSectionStartedTrackEvent(parameters);
    return await this.track(event);
  }
}
