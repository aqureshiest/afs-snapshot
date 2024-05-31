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

// const enum FIELDS {
//   primary_info = "primary_info",
//   employment = "employment",
//   employment_type = "employment_type",
//   income = "income",
//   income_verification_method = "income_verification_method",
// }

class Analytics extends ContractType<Definition, Definition, Output> {
  get contractName(): string {
    return "Analytics";
  }

  /**
   */
  condition = (input: Input, context: Injections, definition: Definition) => {
    const { application } = input;

    const { type } = definition;

    if (!(type in EVENT_TYPE || !application)) {
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
    setImmediate(async () => {
      const { context } = injections;
      try {
        const analyticsServiceClient =
          context.loadedPlugins.analyticsServiceClient.instance;
        assert(
          analyticsServiceClient,
          "[aa8b7701] AnalyticsServiceClient not instantiated",
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
            await analyticsServiceClient.identify(
              this.buildIdentifyProps(input),
            );
            break;
          case EVENT_TYPE.page:
            await analyticsServiceClient.page(
              this.buildPageProps(input, definition),
            );
            break;
          default:
        }
      } catch (error) {
        context.logger.error({
          error,
          message: `[sc44e9r3] Failed to track Segment event. ${error?.message}`,
        });
        this.error(input, error.message);
      }
    });

    return { success: true };
  };

  private buildTrackProps(input: Input, definition: Definition) {
    const { application, auth } = input;

    assert(application?.primary, "[38cb50d5] no auth.session.userId");

    const userId = auth?.session?.userId;

    assert(userId, "[ab4bkv0s] userId is null");

    const { event, payload } = definition;
    /* eslint-disable-next-line @typescript-eslint/no-unused-vars */
    const { fields, ...properties } = payload;
    /* eslint-disable-next-line @typescript-eslint/no-unused-vars */
    const { actionKey, formValue, title, manifest, ...payloadProps } =
      properties;

    const props: TrackParams = {
      userId,
      event: event,
      properties: {
        ...payloadProps,
        section: title,
        application_id: application?.id,
      },
    };

    /// TODO: this must be refactored for v2, as is hardcoded to get primary info
    if (fields && fields.includes("income_verification_method")) {
      let income_verification_method;
      const financialAccounts =
        application?.primary?.details?.financialAccounts || [];
      if (financialAccounts.length > 0) {
        const plaidAccounts = financialAccounts.filter(
          (fA) => fA && fA.plaidAccessToken !== null,
        );
        if (plaidAccounts.length > 0) {
          income_verification_method = "plaid";
        } else {
          income_verification_method = "manual";
        }
      }
      if (income_verification_method) {
        props.properties = {
          ...props.properties,
          income_verification_method,
        };
      }
    }

    // //employment_type
    // if (payload.employment_type) {
    //   props.properties = {
    //     ...props.properties,
    //     employment_type: payload.employment_type,
    //   };
    // } else if (
    //   Array.isArray(payload.fields) &&
    //   payload.fields.includes(FIELDS.employment_type) &&
    //   application?.primary?.details?.income &&
    //   application.primary.details.income.length > 0
    // ) {
    //   props.properties = {
    //     ...props.properties,
    //     employment_type: application.primary.details.income[0]?.type,
    //   };
    // }

    // //income_verification_method
    // if (payload.income_verification_method) {
    //   props.properties = {
    //     ...props.properties,
    //     income_verification_method: payload.income_verification_method,
    //   };
    // } else if (
    //   Array.isArray(payload.fields) &&
    //   payload.fields.includes(FIELDS.income_verification_method) &&
    //   application?.primary?.details?.income &&
    //   application.primary.details.income.length > 0
    // ) {
    //   props.properties = {
    //     ...props.properties,
    //     employment_type: application.primary.details.income[0]?.type,
    //   };
    // }

    // //decision
    // if (payload.decision) {
    //   props.properties = {
    //     ...props.properties,
    //     decision: payload.decision,
    //   };
    // }

    // if (payload.section) {
    //   props.properties = { ...props.properties, section: payload.section };
    // }

    return props;
  }

  private buildIdentifyProps(input: Input) {
    const { application, auth } = input;

    assert(application?.primary, "[18e77f7d] application.primary is null");

    const userId = auth?.session?.userId;

    assert(userId, "[67bb3ee4] userId is null");

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
    const { application, auth } = input;

    assert(application?.primary, "[8a623e0e] application.primary is null");
    /* eslint-disable-next-line @typescript-eslint/no-unused-vars */
    const { fields, ...properties } = definition.payload;
    /* eslint-disable-next-line @typescript-eslint/no-unused-vars */
    const { actionKey, formValue, title, manifest, ...payloadProps } =
      properties;

    const userId = auth?.session?.userId;

    assert(userId, "[bf4e11e6] userId is null");

    const { payload } = definition;

    const props: PageParams = {
      userId,
      name: payload.title,
      properties: {
        ...payloadProps,
        application_id: application.id,
        name: payload.title,
      },
    };

    return props;
  }
}

export default Analytics;
