import {
  Analytics,
  Context,
  IdentifyParams,
  PageParams,
  TrackParams,
} from "@segment/analytics-node";
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

  async track(event: TrackParams): Promise<void> {
    console.log("hii");

    return this.asyncHandler(this.client.track, event, "track");
  }

  async identify(event: IdentifyParams): Promise<void> {
    return this.asyncHandler(this.client.identify, event, "identify");
  }

  async page(event: PageParams): Promise<void> {
    return this.asyncHandler(this.client.page, event, "page");
  }

  private asyncHandler<T extends TrackParams | IdentifyParams | PageParams>(
    fn: (e: T, cb?: (err: unknown, ctx: Context | undefined) => void) => void,
    event: T,
    type: string
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        fn(event, (err: unknown, ctx: Context | undefined) => {
          if (err) {
            this.logError(
              new Error(err["message"]),
              event,
              `${type}-analytics-error`
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
    tag: string
  ) {
    this.logger.error({
      error,
      ...event,
      analyticsTag: tag,
    });
  }
}
