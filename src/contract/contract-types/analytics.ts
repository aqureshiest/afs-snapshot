import assert from "node:assert";
import ContractType from "./base-contract.js";
import {
  IdentifyAnalyticsEvent,
  PageAnalyticsEvent,
  TrackAnalyticsEvent,
} from "../../clients/analytics/index.js";

enum EVENT_TYPE {
  track,
  identify,
  page,
}

class Analytics extends ContractType<Definition, Definition, Output> {
  get contractName(): string {
    return "Analytics";
  }

  /**
   */
  condition = (input: Input, context: Injections, definition: Definition) => {
    const method = input.request?.method;

    const { application } = input;

    const { type } = definition;

    if (!(method && method === "POST")) {
      return false;
    }
    if (!(type in EVENT_TYPE)) {
      return false;
    }

    console.log("application", application);

    if (!application) {
      return false;
    }

    return true;
  };

  /**
   * TODO: use the contracts definition to determine which ApplicationService mutation
   * to apply, and how to construct the payload
   *
   * This function should probably return some information about the event that was created
   */
  evaluate = async (
    input: Input,
    injections: Injections,
    definition: Definition,
  ) => {
    const { context } = injections;

    const analyticsServiceClient =
      context.loadedPlugins.analyticsServiceClient.instance;
    assert(
      analyticsServiceClient,
      "[e6falixw] AnalyticsServiceClient not instantiated",
    );

    console.log("input", input);

    const { type, event } = definition;

    const eventType = EVENT_TYPE[type as keyof typeof EVENT_TYPE];

    switch (eventType) {
      case EVENT_TYPE.track:
        await analyticsServiceClient.track(
          this.buildTrackProps(input, definition),
        );
        break;
      case EVENT_TYPE.identify:
        await analyticsServiceClient.identify(this.buildIdentifyProps(input));
        break;
      case EVENT_TYPE.page:
        await analyticsServiceClient.page(
          this.buildPageProps(input, definition),
        );
        break;
      default:
    }

    return { event };
  };

  toJSON() {
    if (!this.result) return null;
    return {
      event: this.result?.event,
    };
  }

  private buildTrackProps(input: Input, definition: Definition) {
    const { application } = input;

    assert(application, "[rcf1upqz] application is null");

    const userId = application.cognitoID ?? application.monolithUserID;

    assert(userId, "[ab4bkv0s] userId is null");

    const {
      event,
      payload: { section, step },
    } = definition;

    const props: TrackAnalyticsEvent = {
      userId,
      event,
      properties: {
        section,
        applicationId: application.id,
        product: "SLR",
        loan_type: "independent",
        source: "application",
        step,
      },
    };

    return props;
  }

  private buildIdentifyProps(input: Input) {
    const { application } = input;

    assert(application, "[96fie6o9] application is null");

    const userId = application.cognitoID ?? application.monolithUserID;

    assert(userId, "[osb14l7c] userId is null");

    const props: IdentifyAnalyticsEvent = {
      userId,
      traits: {
        applicationId: application.id,
        product: "SLR",
      },
    };

    return props;
  }

  private buildPageProps(input: Input, definition: Definition) {
    const { application } = input;

    assert(application, "[aw4q38ox] application is not null");

    const userId = application.cognitoID ?? application.monolithUserID;

    assert(userId, "[ypdvs5fo] userId is null");

    const {
      payload: { name },
    } = definition;

    const props: PageAnalyticsEvent = {
      userId,
      name,
      properties: {
        applicationId: application.id,
        product: "SLR",
        source: "application",
      },
    };

    return props;
  }
}

export default Analytics;
