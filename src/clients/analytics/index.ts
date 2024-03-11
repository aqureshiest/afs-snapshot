import { Client } from "@earnest/http";
import { Analytics } from "@segment/analytics-node";
import PluginContext from "@earnest-labs/microservice-chassis/PluginContext.js";
// import Logging from "@earnest/node-logging";
// import {Event} from './events.js'

// const { Message, MetaData } = Logging.formats;
// const ANALYTICS_TAG = "analytics";

export default class AnalyticsServiceClient extends Client {
  private client: Analytics;
  private logger: PluginContext["logger"];

  constructor(context: PluginContext, apiKey: string, baseUrl: string) {
    const options = { baseUrl };

    super(options);

    this.client = new Analytics({ writeKey: apiKey });

    if (context.logger != null) {
      this.logger = context.logger;
    }
  }

  get headers() {
    return {
      ...super.headers,
      "Content-Type": "application/json",
      Accept: "application/json",
    };
  }

  track(event: string) {
    try {
      this.client.track({ userId: "1", event });
      this.logger.info({ event });
      //   this.logger.info(this.analyticsLog(event));
    } catch (e) {
      this.logger.error({ event, error: e });
      //   this.logger.error(this.analyticsErrorLog(e, event));
    }
  }

  identify(event: string) {
    try {
      this.client.identify({ userId: "1" });
      this.logger.info({ event });
      //   this.logger.info(this.analyticsLog(event));
    } catch (e) {
      this.logger.error({ event, error: e });
      //   this.logger.error(this.analyticsErrorLog(e, event));
    }
  }

  //   analyticsLog({ event, anonymousId, userId }: Event) {
  //     return Message(
  //       {
  //         event,
  //         anonymousId,
  //         user: {
  //           id: userId
  //         },
  //         userAgent: this.headers["user-agent"]
  //       },
  //       new MetaData.Info("analytics-event", [ANALYTICS_TAG])
  //     );
  //   }

  //   analyticsErrorLog(error: Error, { event, anonymousId, userId }: Event) {
  //     const userAgent = this.headers ? this.headers["user-agent"] : null;
  //     return Message(
  //       {
  //         error,
  //         event,
  //         anonymousId,
  //         user: {
  //           id: userId
  //         },
  //         userAgent
  //       },
  //       new MetaData.Error("analytics-error", [ANALYTICS_TAG])
  //     );
  //   }
}
