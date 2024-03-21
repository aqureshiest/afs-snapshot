import assert from "node:assert";
import ContractType from "./base-contract.js";
import {
  ApplicationType,
  UserRole,
} from "../../typings/clients/analytics/index.js";
import { TrackAnalyticsEvent } from "../../clients/analytics/index.js";

enum EVENT_TYPE {
  track,
  identify,
  pageView,
}

class Analytics extends ContractType<Definition, Definition, void> {
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
      "[7d3b096f] AnalyticsServiceClient not instantiated",
    );

    const {
      type,
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

    const eventType = EVENT_TYPE[type as keyof typeof EVENT_TYPE];

    switch (eventType) {
      case EVENT_TYPE.track:
        await analyticsServiceClient.trackApplicationSectionStarted(props);
        break;
      case EVENT_TYPE.identify:
        break;
      case EVENT_TYPE.pageView:
        break;
      default:
        null;
    }
  };

  toJSON() {
    if (!this.result) return null;
    return {
      event: this.result?.event,
      id: this.result?.payload?.id,
    };
  }
}

export default Analytics;
