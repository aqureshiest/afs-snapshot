import {
  Analytics,
  Context,
  IdentifyParams,
  PageParams,
  TrackParams,
} from "@segment/analytics-node";
import PluginContext from "@earnest-labs/microservice-chassis/PluginContext.js";

export default class AnalyticsServiceClient {
  public segmentClient: Analytics;
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

    this.segmentClient = new Analytics({
      writeKey: apiKey,
    });

    if (context.logger != null) {
      this.logger = context.logger;
    }
  }

  async track(event: TrackAnalyticsEvent): Promise<void> {
    return this.asyncHandler(this.segmentClient.track, event, "track");
  }

  async identify(event: IdentifyAnalyticsEvent): Promise<void> {
    return this.asyncHandler(this.segmentClient.identify, event, "identify");
  }

  async page(event: PageAnalyticsEvent): Promise<void> {
    return this.asyncHandler(this.segmentClient.page, event, "page");
  }

  private asyncHandler<T extends TrackParams | IdentifyParams | PageParams>(
    fn: (e: T, cb?: (err: unknown, ctx: Context | undefined) => void) => void,
    event: T,
    type: string,
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        fn(event, (err: unknown, ctx: Context | undefined) => {
          if (err) {
            this.logError(
              new Error(err["message"]),
              event,
              `${type}-analytics-error`,
            );
            reject(err);
          }
          this.log(ctx, `${type}-analytics-event`);
          resolve();
        });
      } catch (e) {
        this.logError(e, event, `${type}-analytics-error`);
        reject(e);
      }
    });
  }

  private log(ctx: Context | undefined, tag: string) {
    this.logger.info({
      ...ctx,
      analyticsTag: tag,
    });
  }

  private logError(
    error: Error,
    event: TrackParams | IdentifyParams | PageParams,
    tag: string,
  ) {
    this.logger.error({
      error,
      ...event,
      analyticsTag: tag,
    });
  }
}
