import assert from "node:assert";
import ContractType from "./base-contract.js";
import {
  ApplicationType,
  UserRole,
} from "../../typings/clients/analytics/index.js";
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

    const { type } = definition;

    if (!(method && method === "POST")) {
      return false;
    }
    if (!(type in EVENT_TYPE)) {
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

    const { type, event } = definition;

    const eventType = EVENT_TYPE[type as keyof typeof EVENT_TYPE];

    switch (eventType) {
      case EVENT_TYPE.track:
        await analyticsServiceClient.track(this.buildTrackProps(definition));
        break;
      case EVENT_TYPE.identify:
        await analyticsServiceClient.identify(
          this.buildIdentifyrops(definition),
        );
        break;
      case EVENT_TYPE.page:
        await analyticsServiceClient.page(this.buildPageProps(definition));
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

  private buildTrackProps(definition: Definition) {
    const {
      event,
      payload: { id, section, product_subtype, initiator, role },
    } = definition;

    const props: TrackAnalyticsEvent = {
      anonymousId: id,
      event,
      properties: {
        section,
        product: "SLR",
        product_subtype: product_subtype as ApplicationType,
        initiator: initiator as UserRole,
        role: role as UserRole,
      },
    };

    return props;
  }

  private buildIdentifyrops(definition: Definition) {
    const {
      payload: { id, section, product_subtype, initiator, role },
    } = definition;

    const props: IdentifyAnalyticsEvent = {
      anonymousId: id,
      traits: {
        section,
        product: "SLR",
        product_subtype: product_subtype as ApplicationType,
        initiator: initiator as UserRole,
        role: role as UserRole,
      },
    };

    return props;
  }

  private buildPageProps(definition: Definition) {
    const {
      payload: { id, section, product_subtype, initiator, role },
    } = definition;

    const props: PageAnalyticsEvent = {
      anonymousId: id,
      properties: {
        section,
        product: "SLR",
        product_subtype: product_subtype as ApplicationType,
        initiator: initiator as UserRole,
        role: role as UserRole,
      },
    };

    return props;
  }
}

export default Analytics;
