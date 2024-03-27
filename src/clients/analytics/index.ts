import { Analytics, Context } from "@segment/analytics-node";
import PluginContext from "@earnest-labs/microservice-chassis/PluginContext.js";

export default class AnalyticsServiceClient {
  private client: Analytics;
  private logger: PluginContext["logger"];

  constructor(context: PluginContext, apiKey: string) {
    if (!apiKey) {
      const error = new Error("[77vuxai5] no api key found");
      context.logger.error({
        error,
        message: error.message,
      });
      throw error;
    }

    this.client = new Analytics({
      writeKey: apiKey,
    });

    if (context.logger != null) {
      this.logger = context.logger;
    }
  }

  async track(event: TrackAnalyticsEvent): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.client.track(event, (err, ctx) => {
          if (err) {
            this.logError(
              new Error(err["message"]),
              event,
              "track-analytics-error",
            );
            reject(err);
          }
          this.log(ctx, "track-analytics-event");
          resolve();
        });
      } catch (e) {
        this.logError(e, event, "track-analytics-error");
        reject(e);
      }
    });
  }

  identify(event: IdentifyAnalyticsEvent): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.client.identify(event, (err, ctx) => {
          if (err) {
            this.logError(
              new Error(err["message"]),
              event,
              "identify-analytics-error",
            );
            reject(err);
          }
          this.log(ctx, "identify-analytics-event");
          resolve();
        });
      } catch (e) {
        this.logError(e, event, "identify-analytics-error");
        reject(e);
      }
    });
  }

  page(event: PageAnalyticsEvent): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.client.identify(event, (err, ctx) => {
          if (err) {
            this.logError(
              new Error(err["message"]),
              event,
              "page-analytics-error",
            );
            reject(err);
          }
          this.log(ctx, "page-analytics-event");
          resolve();
        });
      } catch (e) {
        this.logError(e, event, "page-analytics-error");
        reject(e);
      }
    });
  }

  log(ctx: Context | undefined, tag: string) {
    this.logger.info({
      ...ctx,
      analyticsTag: tag,
    });
  }

  logError(error: Error, event: AnalyticsEvent, tag: string) {
    this.logger.error({
      error,
      ...event,
      analyticsTag: tag,
    });
  }
}
