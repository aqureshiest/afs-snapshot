import assert from "node:assert";
import ContractType from "./base-contract.js";
import {
  IdentifyParams,
  PageParams,
  TrackParams,
} from "@segment/analytics-node";

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

    const { type } = definition;

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

    return { success: true };
  };

  private buildTrackProps(input: Input, definition: Definition) {
    const { application } = input;

    assert(application, "[rcf1upqz] application is null");

    const userId = "draj1234"; //application.cognitoID ?? application.monolithUserID;

    // assert(userId, "[ab4bkv0s] userId is null");

    const { payload } = definition;

    const props: TrackParams = {
      userId,
      event: payload.event,
      properties: {
        applicationId: application.id,
        product: application.product,
        loan_type:
          application.tags && application.tags.length > 0
            ? application.tags[0]
            : null,
        source: "application",
      },
    };

    //employment_type
    if (
      application.details &&
      application.details.income &&
      application.details.income.length > 0
    ) {
      props.properties = {
        ...props.properties,
        employment_type: application.details.income[0]?.type,
      };
    }

    //income_verification_method
    if (
      application.details &&
      application.details.financialAccounts &&
      application.details.financialAccounts.length > 0
    ) {
      props.properties = {
        ...props.properties,
        income_verification_method:
          application.details.financialAccounts[0]?.type,
      };
    }

    //decision
    if (application.status) {
      props.properties = {
        ...props.properties,
        decision: application.status.name,
      };
    }

    if (payload.section) {
      props.properties = { ...props.properties, section: payload.section };
    }

    return props;
  }

  private buildIdentifyProps(input: Input) {
    const { application } = input;

    assert(application, "[96fie6o9] application is null");

    const userId = application.cognitoID ?? application.monolithUserID;

    assert(userId, "[osb14l7c] userId is null");

    const props: IdentifyParams = {
      userId,
      traits: {
        applicationId: application.id,
        product: application.product,
      },
    };

    return props;
  }

  private buildPageProps(input: Input, definition: Definition) {
    const { application } = input;

    assert(application, "[aw4q38ox] application is not null");

    const userId = application.cognitoID ?? application.monolithUserID;

    assert(userId, "[ypdvs5fo] userId is null");

    const { payload } = definition;

    const props: PageParams = {
      userId,
      name: payload.name,
      properties: {
        applicationId: application.id,
        product: application.product,
        source: "application",
      },
    };

    if (payload.title) {
      props.properties = { ...props.properties, title: payload.title };
    }

    return props;
  }
}

export default Analytics;
