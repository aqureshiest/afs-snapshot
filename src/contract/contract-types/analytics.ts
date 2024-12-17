import assert from "node:assert";
import ContractExecutable from "../contract-executable.js";
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

class Analytics extends ContractExecutable<Definition, Definition, Output> {
  get executionName(): string {
    return "Analytics";
  }

  /**
   */
  condition = (_, __, input: Input, definition: Definition) => {
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
    context: Context,
    executionContext,
    input: Input,
    definition: Definition,
  ) => {
    setImmediate(async () => {
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
              this.buildTrackProps(input, definition, input?.request?.cookies),
            );
            break;
          case EVENT_TYPE.identify:
            await analyticsServiceClient.identify(
              this.buildIdentifyProps(input, input?.request?.cookies),
            );
            break;
          // not sending this type of events from the server side.
          // case EVENT_TYPE.page:
          //   await analyticsServiceClient.page(
          //     this.buildPageProps(input, definition),
          //   );
          //   break;
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

  private buildTrackProps(
    input: Input,
    definition: Definition,
    cookies: Cookies,
  ) {
    const { application, auth } = input;

    const {
      event,
      payload,
      userId: defUserId,
      anonymousId: defAnonymousId,
    } = definition;
    /* eslint-disable-next-line @typescript-eslint/no-unused-vars */
    const { serverProperties, ...properties } = payload;

    // User Identity props can be passed in the definition or derived from request
    const userId = defUserId || auth?.artifacts?.userId;
    const anonymousId = defAnonymousId || cookies.ajs_anonymous_id;

    /* eslint-disable-next-line @typescript-eslint/no-unused-vars */
    const { actionKey, formValue, title, manifest, ...payloadProps } =
      properties;

    const props: TrackParams = {
      userId,
      anonymousId,
      event: event,
      properties: {
        ...payloadProps,
        application_id: application?.id,
      },
    };

    // hacky thingy to get the employment_type without "_" in it
    // if you wanna change this, talk to kelly first.
    if (props?.event === "Server Application Submitted") {
      delete props?.properties?.section;
    }
    if (props?.properties?.employment_type) {
      props.properties.employment_type = payloadProps.employment_type
        .toString()
        .replace(/_/g, " ");
      if (props.properties.employment_type === "future") {
        props.properties.employment_type = "future employment";
      }
    }
    return props;
  }

  private buildIdentifyProps(input: Input, cookies: Cookies) {
    const { application, auth } = input;

    assert(application?.primary, "[18e77f7d] application.primary is null");

    const userId = auth?.artifacts?.userId;

    assert(userId, "[67bb3ee4] userId is null");

    const props: IdentifyParams = {
      userId,
      anonymousId: cookies.ajs_anonymous_id,
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

    const userId = auth?.artifacts?.userId;

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
