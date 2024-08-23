import assert from "node:assert";
import PluginContext from "@earnest-labs/microservice-chassis/PluginContext.js";
import { TEMP_DEFAULT_APPLICATION_QUERY } from "../application-service/graphql.js";
import * as typings from "@earnest/application-service-client/typings/codegen.js";
import createError from "http-errors";

import flattenApplication from "../../api/helpers.js";
import Client from "../client.js";
import {
  GetMinPaymentPricePayload,
  GetMinPaymentPriceResponse,
} from "../calculator-service/index.js";

export enum WebhookTypeEnum {
  APPLICATION_STATUS = "APPLICATION_STATUS",
  APPLICATION_REVIEW = "APPLICATION_REVIEW",
  APPLICATION_DOCUMENT_REQUEST = "APPLICATION_DOCUMENT_REQUEST",
  APPLICATION_UPDATE = "APPLICATION_UPDATE",
}
enum EntityStatus {
  PENDING_REVIEW = "pending_review",
  PENDING_DOCUMENTS = "pending_documents",
}

enum EntityStatusMapping {
  REVIEW = "review",
  AI_REQUESTED = "ai_requested",
}

enum AlloyDecision {
  APPROVED = "Approved",
  DENIED = "Denied",
  TIMEOUT = "Time out",
  WITHDRAWN = "Withdrawn",
}

enum DecisionStatusMapping {
  APPROVED = "approved",
  DECLINED = "declined",
  EXPIRED = "expired",
  WITHDRAWN = "withdrawn",
}

enum EmploymentTypes {
  EMPLOYMENT = "employment",
  UNSPECIFIED = "unspecified",
}

enum IncomeTypes {
  INVESTMENT = "investment",
  SOCIAL_SECURITY_OR_PENSION = "social_security_or_pension",
  CHILD_SUPPORT_OR_ALIMONY = "child_support_or_alimony",
  RENTAL = "rental",
  K1 = "k1",
  DISABILITY = "disability",
}

enum ApplicationTypes {
  "primary_only" = "PRIMARY_ONLY",
  "cosigned" = "COSIGNED",
}

enum ProductTypes {
  "student-refi" = "slr",
}

enum TermLengths {
  "5 year" = 60,
  "7 year" = 84,
  "10 year" = 120,
  "15 year" = 180,
  "20 year" = 240,
}

export default class LendingDecisionServiceClient extends Client {
  get clientName() {
    return "LendingDecisionService";
  }
  private accessKey: string;

  constructor(accessKey: string, baseUrl: string) {
    const options = { baseUrl };
    super(options);
    this.accessKey = accessKey;
  }

  /**
   * Saves any updated application statuses to the Application Database
   * that we recieve from Lending Decision Service via the webhook interface
   * they interact with.
   * @param context PluginContext
   * @param id string - Monolith Application ID
   */
  async saveDecision(
    input: Input<unknown>,
    context: PluginContext,
    id: string,
    payload: WebhookEventPayload,
  ): Promise<void> {
    const { data, webhookType } = payload;
    const { decision, entity, status } = data;

    if (!input.auth?.isInternal || !input.auth?.isValid) {
      throw createError.Unauthorized("unauthorized");
    }
    /* ============================== *
     * Log webhook event
     * ============================== */
    this.log({
      event: webhookType,
      decision,
      ...(status ? { status } : {}),
      id,
    });

    /* ============================== *
     * Return immediately if the webhook is an APPLICATION_UPDATE event
     * These event aren't actionable and should only be logged
     * ============================== */
    if (webhookType === WebhookTypeEnum.APPLICATION_UPDATE) {
      return;
    }

    const applicationServiceClient =
      context.loadedPlugins.applicationServiceClient?.instance;

    if (!applicationServiceClient) {
      throw new Error(
        "[88379256] Application Service client instance not found",
      );
    }

    /* ============================== *
     * Find an application by the monolith application id
     * This search via the monolith application id would return
     * the primary application. Query with root field key to obtain
     * the root application id of primary application
     * ============================== */
    let application;
    const ApplicantFragment = `
    fragment ApplicantFragment on Application {
      id
      monolithUserID
      details {
        income {
          amount
          type
          employer
          name
          title
          start
          end
        }
      }
      tag {
        applicants
      }
    }
    `;

    try {
      const result = (await applicationServiceClient["sendRequest"]({
        query: String.raw`
        ${ApplicantFragment}
        query Applications($criteria: [ApplicationSearchCriteria]!) {
          applications(criteria: $criteria) {
              ...ApplicantFragment
              root {
                ...ApplicantFragment
              }
              primary {
                ...ApplicantFragment
              }
            }
          }
          `,
        variables: {
          criteria: [
            {
              monolithApplicationID: id,
            },
          ],
        },
      })) as unknown as { applications: Array<typings.Application> };

      application = result["applications"][0];
    } catch (error) {
      this.log(
        {
          error,
          message: `[415e1534] error while retrieving application`,
          stack: error.stack,
        },
        context,
      );
      throw error;
    }

    try {
      const status = this.deriveStatusFromEvent(payload);
      if (status) {
        await applicationServiceClient["sendRequest"]({
          query: String.raw`mutation (
            $id: UUID!
            $meta: EventMeta
            $status: ApplicationStatusName!
            ) {
              setStatus(id: $id, meta: $meta, status: $status) {
              id
              application {
                id
              }
            }
          }`,
          variables: {
            ...(entity
              ? {
                  id: application.id, // update the applicant's status if an entity is passed
                }
              : {
                  id: application.root.id, // otherwise, update the root application status
                }),
            status,
            meta: { service: "apply-flow-service" },
          },
        });
      }
    } catch (error) {
      this.log(
        {
          error,
          message: `[8e1d8731] Updating Status of Application`,
          stack: error.stack,
        },
        context,
      );
      throw error;
    }
  }

  /**
   * Fetches a decision status from Lending Decision Service
   * @param context PluginContext
   * @param lendingDecisionId string
   * @returns {Promise<DecisionResponseDetails>}
   */
  async getDecision(
    input: Input<unknown>,
    context: PluginContext,
    lendingDecisionId: string,
    payload = {}, // eslint-disable-line @typescript-eslint/no-unused-vars,
  ): Promise<DecisionGetResponse> {
    if (!lendingDecisionId) {
      throw new Error("[3144deaa] missing lending decision id");
    }

    const { results, response } = await this.get<DecisionGetResponse>(
      {
        uri: `/v1/decision/${lendingDecisionId}`,
        headers: {
          ...this.headers,
          Authorization: `Bearer ${this.accessKey}`,
        },
      },
      context,
    );

    if (response.statusCode && response.statusCode >= 400) {
      const error = new Error(
        `[31b3882a] Failed to get decision: ${response.statusMessage}`,
      );
      context.logger.error({
        decisionToken: lendingDecisionId,
        error,
        message: response.statusMessage, // Log the actual status message from LDS
        statusCode: response.statusCode,
        results,
      });
      throw error;
    }

    return results;
  }

  async getArtifacts(
    input: Input<unknown>, // eslint-disable-line @typescript-eslint/no-unused-vars,
    context: PluginContext,
    lendingDecisionId: string,
    payload,
  ): Promise<ArtifactGetResponse> {
    if (!lendingDecisionId) {
      throw new Error("[1704fbd0] missing lending decision id");
    }

    const { results, response } = await this.get<ArtifactGetResponse>(
      {
        uri: `/v1/artifact/${payload.type}/${lendingDecisionId}/${payload.artifactType}`,
        headers: {
          ...this.headers,
          Authorization: `Bearer ${this.accessKey}`,
        },
      },
      context,
    );

    if (response.statusCode && response.statusCode >= 400) {
      const error = new Error(
        `[de6308f4] Failed to get artifacts: ${response.statusMessage}`,
      );
      context.logger.error({
        decisionToken: lendingDecisionId,
        error,
        message: response.statusMessage, // Log the actual status message from LDS
        statusCode: response.statusCode,
        results,
      });
      throw error;
    }

    return results;
  }

  async getPaymentsAndRates(
    input: Input<unknown>, // eslint-disable-line @typescript-eslint/no-unused-vars,
    context: PluginContext,
    lendingDecisionId: string,
    payload,
  ): Promise<Array<FilteredPrices>> {
    if (!lendingDecisionId) {
      throw new Error("[2542e05a] missing lending decision id");
    }

    const calculatorServiceClient =
      context.loadedPlugins.calculatorServiceClient?.instance;

    if (!calculatorServiceClient)
      throw new Error(
        "[f5d34f55] Calculator Service client instance not found",
      );
    const { results, response } = await this.get<ArtifactGetResponse>(
      {
        uri: `/v1/artifact/${payload.type}/${lendingDecisionId}/rate_check`,
        headers: {
          ...this.headers,
          Authorization: `Bearer ${this.accessKey}`,
        },
      },
      context,
    );

    if (response.statusCode && response.statusCode >= 400) {
      const error = new Error(
        `[378e8d85] Failed to get price curves: ${response.statusMessage}`,
      );
      context.logger.error({
        decisionToken: lendingDecisionId,
        error,
        message: response.statusMessage, // Log the actual status message from LDS
        statusCode: response.statusCode,
        results,
      });
      throw error;
    }

    const filteredPrices = this.filterPriceCurve(
      results.data.artifacts.priceCurve,
    );
    const prices = filteredPrices.map((filteredPrice, index) => {
      return {
        rateInBps: filteredPrice.rate,
        uwLoanTermInMonths: filteredPrice.term,
        rateType: filteredPrice.rateType,
        startingPrincipalBalanceInCents:
          results.data.artifacts.softApprovedAmount,
        date: results.data.artifacts.softInquiryDate.split("T")[0],
        dateType: "fti",
        priceId: index,
      };
    });

    const calculatorPayload = {
      prices,
    } as GetMinPaymentPricePayload;

    const payments = (await calculatorServiceClient["getMinPaymentPrice"](
      context,
      calculatorPayload,
    )) as unknown as GetMinPaymentPriceResponse;

    const ratesAndPayments = payments?.prices?.map((price) => {
      return {
        rate: price.rateInBps,
        rateType: price.rateType,
        term: price.uwLoanTermInMonths,
        minPaymentAmountInCents: price.minimumPaymentAmountInCents,
      };
    });
    return ratesAndPayments;
  }

  /**
   * Sends a POST request on the decision endpoint to LDS
   * @param context PluginContext
   * @param applicationId string Root Application ID
   * @returns {Promise<DecisionPostResponse>}
   */
  async postDecisionRequest(
    input: Input<unknown>,
    context: PluginContext,
    applicationId: string, // Assuming root app ID
    payload = {}, // eslint-disable-line @typescript-eslint/no-unused-vars,
  ): Promise<DecisionPostResponse> {
    const decisionType = "application";
    let application = input["application"];
    if (!application) {
      application = (await this.getApplication(
        context,
        applicationId,
      )) as typings.Application;
      application = flattenApplication(application);
    }

    const applicationDecisionDetails = {};
    for (const applicant of [
      APPLICANT_TYPES.Primary,
      APPLICANT_TYPES.Cosigner,
    ]) {
      if (application[applicant]) {
        applicationDecisionDetails[applicant] = await this.formatRequestPayload(
          input,
          context,
          application as typings.Application, // Pass full application. We need loan amount and rates details from root
          applicant,
          decisionType,
        );
      }
    }
    /* ============================== *
     * The monolith references have breached containment
     * May god help us all
     * ============================== */

    const monolithUserID = application[APPLICANT_TYPES.Primary]?.monolithUserID
      ? application[APPLICANT_TYPES.Primary].monolithUserID
      : application?.monolithUserID;
    const monolithApplicationID =
      application[APPLICANT_TYPES.Primary]?.monolithApplicationID;
    const monolithLoanID = application.monolithLoanID;

    if (monolithLoanID && monolithUserID && monolithApplicationID) {
      const monolithIDs = {
        monolithLoanID: monolithLoanID,
        monolithUserID: monolithUserID,
        monolithApplicationID: monolithApplicationID,
      };
      await this.legacyDataSync(input, context, monolithIDs);
    }

    /* ============================== *
     * TODO: applications with multiple applicants will need more information
     * to determine which applicants are submitted
     * ============================== */
    await this.setSubmittedStatus(context, application, applicationId);

    const decisionPayload = {
      product: "SLR", // TODO: For v2 use application.product where can be string 'student-refi' or 'student-origination'
      decisioningWorkflowName: "AUTO_APPROVAL",
      decisionSource: "apply-flow-service",
      applicationType: "PRIMARY_ONLY", // TODO: For v2 use application.tags where can be string ['primary_only','cosigned', 'parent_plus']
      requestMetadata: {
        applicationId: monolithApplicationID,
        userId: monolithUserID,
      },
      isInternational: false, // TODO: FOR Decision, what happens if international and SSNs?
      appInfo: applicationDecisionDetails,
    } as unknown as DecisionRequestDetails;

    const lendingDecisionURI = "/v2/decision";
    // New Decision endpoint is live in staging, but only for rate check.
    // Continue to use old `v2/decision` until https://meetearnest.atlassian.net/browse/LD-1386 is done
    // product = slo | slr
    // decisionType = rate-check | application (application full app submit decision)
    // const uri = "/v2/decisioning-request/:product/:decisionType"

    const { results, response } = await this.post<DecisionPostResponse>(
      {
        uri: lendingDecisionURI,
        headers: {
          ...this.headers,
          Authorization: `Bearer ${this.accessKey}`,
        },
        body: decisionPayload,
        resiliency: {
          attempts: 3,
          delay: 1000,
          timeout: 30000,
          test: ({ response }) =>
            Boolean(response.statusCode && response.statusCode <= 500),
        },
      },
      context,
    );

    if (response.statusCode && response.statusCode >= 400) {
      const error = new Error(
        `[a571403f] Failed to post decision: ${response.statusMessage}`,
      );
      this.log(
        {
          appID: applicationId,
          error,
          message: response.statusMessage, // Log the actual status message from LDS
          statusCode: response.statusCode,
          results,
        },
        context,
      );
      throw error;
    }

    /**
     * Store the lending decision token as a reference
     */
    await this.saveLendingDecisionId(
      context,
      application[APPLICANT_TYPES.Primary].id, // TODO: Send application id of initiator
      results.data.decisioningToken,
      decisionType,
    );

    return results;
  }

  async rateCheckRequest(
    input: Input<unknown>,
    context: PluginContext,
    applicationId: string, // Assuming root app ID
    payload = {}, // eslint-disable-line @typescript-eslint/no-unused-vars,
  ): Promise<RateRequestResponse> {
    const decisionType = "rate-check";
    let application = input["application"];
    if (!application) {
      application = (await this.getApplication(
        context,
        applicationId,
      )) as typings.Application;
      application = flattenApplication(application);
    }

    const applicationDecisionDetails = {};
    for (const applicant of [
      APPLICANT_TYPES.Primary,
      APPLICANT_TYPES.Cosigner,
    ]) {
      if (application[applicant]) {
        applicationDecisionDetails[applicant] = await this.formatRequestPayload(
          input,
          context,
          application as typings.Application, // Pass full application. We need loan amount and rates details from root
          applicant,
          decisionType,
        );
      }
    }

    /**
     * Application Tags is an array of strings, where the first element is overall application status
     * and last element is the application type
     */
    const appType = await this.getApplicationType(context, applicationId);

    const rateRequestPayload = {
      applicationType: ApplicationTypes[appType],
      initiator: APPLICANT_TYPES.Primary, // TODO: determine who is initiator, maybe look at created at tag for cosigner/primary. Oldest is init
      requestMetadata: {
        rootApplicationId: application.id,
        applicationRefId: application[APPLICANT_TYPES.Primary].refId,
        applicationId: application[APPLICANT_TYPES.Primary].id,
        userId: input?.auth?.artifacts?.userID, // Should we assert, at this point should have been authenticated
      },
      isInternational: false, // TODO: FOR Decision, what happens if international and SSNs?
      isMedicalResidency: false,
      appInfo: applicationDecisionDetails,
    } as unknown as RateRequestDetails;

    assert(
      application?.product,
      "[c3b14b3d] Missing application product in rate check request",
    );

    const { results, response } = await this.post<RateRequestResponse>(
      {
        uri: `/v2/decisioning-request/${application?.product}/${decisionType}`,
        headers: {
          ...this.headers,
          Authorization: `Bearer ${this.accessKey}`,
        },
        body: rateRequestPayload,
        resiliency: {
          attempts: 3,
          delay: 1000,
          timeout: 30000,
          test: ({ response }) =>
            Boolean(response.statusCode && response.statusCode <= 500),
        },
      },
      context,
    );

    if (response.statusCode && response.statusCode >= 400) {
      const error = new Error(
        `[53a1b21d] Failed to post rate check: ${response.statusMessage}`,
      );
      this.log(
        {
          appID: applicationId,
          error,
          message: response.statusMessage, // Log the actual status message from LDS
          statusCode: response.statusCode,
          results,
        },
        context,
      );
      throw error;
    }

    /**
     * Store the lending decision token as a reference
     */
    await this.saveLendingDecisionId(
      context,
      application[APPLICANT_TYPES.Primary].id,
      results.data.decisioningToken,
      decisionType,
    );

    return results;
  }
  /**
   * ================================================ *
   * Private Methods
   * ================================================ */

  /**
   * Private method to get the application type via Tag system
   */

  private async getApplicationType(
    context: PluginContext,
    applicationId: string,
  ): Promise<string> {
    const applicationServiceClient =
      context.loadedPlugins.applicationServiceClient?.instance;
    if (!applicationServiceClient)
      throw new Error(
        "[6b2fc666] Application Service client instance not found",
      );
    const applicationTypeResult = (await applicationServiceClient[
      "sendRequest"
    ]({
      query: String.raw`query getApplication($id: String!, $root: Boolean) {
          application(id: $id, root: $root) {
            tag {
              active
              status
              applicants
            }
          }
        }`,
      variables: {
        id: applicationId,
        root: true,
      },
    })) as unknown as {
      application: {
        tag: { active: string; status: string; applicants: string };
        error: string | null;
      };
    };

    const applicationTypeError = applicationTypeResult?.application?.error;
    if (applicationTypeError) {
      const error = new Error("[2b1fb250] Failed to get application type tag");
      context.logger.warn({
        message: applicationTypeError,
      });
      throw error;
    }
    return applicationTypeResult?.application?.tag?.applicants || "";
  }
  /**
   * Private method to format the application data into the
   * defined payload contract structure for Lending Decision Service
   * @param context PluginContext
   * @param application IApplicationFragment
   * @returns {DecisionEntity}
   */
  private async formatRequestPayload(
    input: Input<unknown>,
    context: PluginContext,
    application: typings.Application,
    applicant: string,
    decisionType: string,
  ): Promise<DecisionEntity> {
    const { details } = application[applicant];
    const applicantSSN = application[applicant].ssnTokenURI
      ? application[applicant].ssnTokenURI
      : "";

    if (!details) {
      throw new Error(
        "[42b4cf11] Unable to parse application detail information",
      );
    }

    /**
     * Format the location details in the Entity address shape
     */
    const addresses = this.applicantAddresses(details.location);

    /**
     * Obtain the applicant's citizenship. Based on their primary address location
     */
    const citizenshipStatus = this.applicantCitizenship(details.location);

    /**
     * Format the education details in the Entity education shape
     */
    const educationDetails = await this.applicantEducation(
      input,
      context,
      details.education,
    );

    /**
     * Format the applicant income details
     */
    let incomeDetails;
    if (decisionType === "rate-check") {
      incomeDetails = this.applicantIncomesRateCheck(details.income);
    } else {
      incomeDetails = this.applicantIncomes(details.income);
    }

    /**
     * Obtain and format the applicant's employment details
     */
    const employmentDetails = this.applicantEmployment(details.income);

    /**
     * Special case check for retired employment status
     */
    const retiredEmploymentDetails = this.applicantRetiredEmployment(
      details.income,
      employmentDetails,
      incomeDetails,
    );

    const assetsDetails = this.applicantAssets(details.asset);

    const financialAccountDetails = await this.applicantFinancialInfo(
      input,
      context,
      details.financialAccounts,
    );

    const ratesInfo = this.applicationRatesInfo(application);
    const rateCheckRatesAdjustmentInfo = {
      rateAdjustmentInfo: {
        name: ratesInfo?.rateAdjustmentData?.name,
        amount: ratesInfo?.rateAdjustmentData?.amount,
      },
    } as DecisionEntity["ratesInfo"];

    const entityDetails = {
      firstName: details.name?.first || "",
      lastName: details.name?.last || "",
      dob: details.dateOfBirth
        ? new Date(details.dateOfBirth).toISOString()
        : "",
      addresses,
      ssn: applicantSSN,
      email: details?.email || "",
      phoneNumber:
        details.phone?.find((phoneDetail) => phoneDetail && phoneDetail.number)
          ?.number || "", // get first non-null number
      citizenshipStatus,
    };

    /*
     * The end result formatted for LDS
     */
    let formattedPayload = {
      entityInfo: entityDetails,
      educations: educationDetails,
      incomes: incomeDetails,
      assets: assetsDetails,
      loanInfo: {
        claimedLoanAmount: application.details?.amount?.requested,
      },
    } as DecisionEntity;

    /**
     * If decisionType is 'rate-check' we do not include
     * employment or financial account details in request payload
     */
    if (decisionType === "application") {
      formattedPayload = {
        ...formattedPayload,
        employments:
          employmentDetails && employmentDetails.length > 0
            ? employmentDetails
            : retiredEmploymentDetails,
        financialInfo: financialAccountDetails,
        ratesInfo: ratesInfo,
      };
    } else {
      formattedPayload = {
        ...formattedPayload,
        ratesInfo: rateCheckRatesAdjustmentInfo,
      };
    }

    return formattedPayload;
  }

  /**
   * Derive correct application status from the Decision Webhook event
   * @param payload Webhook event payload
   * @returns {string}
   */
  private deriveStatusFromEvent = (payload: WebhookEventPayload) => {
    const { data, webhookType } = payload;
    const { decision, entity } = data;

    let status;
    switch (webhookType) {
      /* ============================== *
       * APPLICATION_STATUS events are specifically used
       * to update the root application status
       * ============================== */
      case WebhookTypeEnum.APPLICATION_STATUS:
        // use the decision to map to the correct root status
        switch (decision) {
          case AlloyDecision.APPROVED:
            status = DecisionStatusMapping.APPROVED;
            break;

          case AlloyDecision.DENIED:
            status = DecisionStatusMapping.DECLINED;
            break;
          case AlloyDecision.TIMEOUT:
            status = DecisionStatusMapping.EXPIRED;
            break;
          case AlloyDecision.WITHDRAWN:
            status = DecisionStatusMapping.WITHDRAWN;
            break;
          default:
            throw new Error("[4b0a0bd3] Unhandled APPLICATION_STATUS event");
        }
        break;
      /* ============================== *
       * APPLICATION_REVIEW && APPLICATION_DOCUMENT_REQUEST events
       * signify that we need to update the applicant's status
       * ============================== */
      case WebhookTypeEnum.APPLICATION_REVIEW:
        // use the entity's status to map to the correct applicant status
        switch (entity && entity.status) {
          case EntityStatus.PENDING_REVIEW:
            status = EntityStatusMapping.REVIEW;
            break;

          default:
            throw new Error("[31d7e02f] Unhandled APPLICATION_REVIEW event");
        }
        break;

      case WebhookTypeEnum.APPLICATION_DOCUMENT_REQUEST:
        switch (entity && entity.status) {
          case EntityStatus.PENDING_DOCUMENTS:
            status = EntityStatusMapping.AI_REQUESTED;
            break;

          default:
            throw new Error(
              "[94d72f20] Unhandled APPLICATION_DOCUMENT_REQUEST event",
            );
        }
        break;
      /* ============================== *
       * APPLICATION_UPDATE events do not map to status updates
       * ============================== */
      case WebhookTypeEnum.APPLICATION_UPDATE:
        status = null;
        break;
      /* ============================== *
       * Throw for any unhandled webhook events
       * ============================== */
      default:
        throw new Error("[3320c677] Unhandled webhook event");
    }

    return status;
  };

  /**
   * Formats the location details of an application into a Decision Entity array of
   * Address objects
   * @param locationDetail Application Location Details
   * @returns {DecisionEntity["entityInfo"]["addresses"]}
   */
  private applicantAddresses(
    locationDetail: typings.Details["location"],
  ): DecisionEntity["entityInfo"]["addresses"] | [] {
    if (locationDetail) {
      const addresses = locationDetail
        .filter((location) => location && Object.keys(location).length > 0)
        .map((location) => {
          return {
            addressLine1: location?.street1,
            addressLine2: location?.street2 ? location.street2 : "",
            city: location?.city,
            state: location?.state,
            zip: location?.zip,
            country: "US", // TODO: get country if/when we process International applicants
            type: location?.type,
          };
        });
      return addresses;
    }
    return [];
  }

  /**
   * Finds the primary location in array of location details and
   * returns correct citizenship mapping for Lending Decision.
   * @param locationDetail Application Location Details
   * @returns {string}
   */
  private applicantCitizenship(
    locationDetail: typings.Details["location"],
  ): string {
    let citizenshipStatus;

    if (locationDetail && locationDetail.length > 0) {
      citizenshipStatus = locationDetail.find(
        (location) => location?.type === "primary",
      )?.citizenship;
      if (citizenshipStatus === "citizen") {
        // LDS expects 'us_citizen' instead. After V1, we should
        // align on one standard for describing a US citizen
        citizenshipStatus = "us_citizen";
      } else if (citizenshipStatus === "non-resident") {
        // LDS expects 'other' instead. After V1, we should
        // align on one standard for describing a non-resident
        citizenshipStatus = "other";
      }
    }

    return citizenshipStatus ? citizenshipStatus : "";
  }

  /**
   * Formats the education details of an application into a Decision Entity array of
   * Education objects
   * @param input Input contract
   * @param context PluginContext
   * @param edcuationDetails Application education details
   * @returns
   */
  private async applicantEducation(
    input: Input<unknown>,
    context: PluginContext,
    edcuationDetails: typings.Details["education"],
  ): Promise<DecisionEntity["educations"] | []> {
    const accreditedSchoolService =
      context.loadedPlugins.accreditedSchoolService?.instance;

    if (!accreditedSchoolService)
      throw new Error(
        "[964e8743] Accredited School Service client instance not found",
      );
    /**
     * Format the education details
     */
    if (edcuationDetails) {
      const schoolDetails: Promise<{
        [key: string]: unknown;
      }>[] =
        edcuationDetails
          .filter((education) => education && Object.keys(education).length > 0)
          .map(async (education) => {
            const searchedSchool = (
              await accreditedSchoolService["getSchools"](input, context, {
                opeid: education?.opeid,
              })
            )?.[0];

            if (!searchedSchool) {
              throw new Error(
                `[97816200] failed to get School with id ${education?.opeid}`,
              );
            }
            /**
             * Found the school using the opeid, but now we need to query
             * school service again with the schoolId to find the
             * `forProfit` field....
             */
            const foundSchool = await accreditedSchoolService["getSchool"](
              input,
              context,
              {
                id: searchedSchool.id,
              },
            );

            return {
              degreeType: education?.degree ? education?.degree : "",
              endDate: education?.graduationDate
                ? new Date(education.graduationDate).toISOString()
                : "",
              schoolName: foundSchool?.name,
              schoolCode: `${foundSchool?.id}`,
              schoolType: foundSchool?.forProfit
                ? "for_profit"
                : "not_for_profit",
              opeid: education?.opeid,
            };
          }) || [];

      return (await Promise.all(schoolDetails)) as DecisionEntity["educations"];
    }
    return [];
  }

  /**
   * Returns a filtered array of income details based on the input filterTypes array
   * @param incomeDetails Application Income Details
   * @param filterTypes Array of Income Types to filter
   * @returns {typings.Details["income"]}
   */
  private filterIncomeDetails(
    incomeDetails: typings.Details["income"],
    filterTypes: Array<string>,
  ): typings.Details["income"] | undefined {
    return incomeDetails?.filter((income) => {
      if (filterTypes.includes(income?.type as string)) return income;
    });
  }

  /**
   * Formats the income details of an application into a Decision Entity array of
   * Income objects
   * @param incomeDetails Application Income Details
   * @returns {DecisionEntity["incomes"]}
   */
  private applicantIncomesRateCheck(
    incomeDetails: typings.Details["income"],
  ): DecisionEntity["incomes"] | [] {
    if (!incomeDetails || (incomeDetails && incomeDetails.length === 0))
      return [];

    /* ============================== *
     * Pre rate check, income detail at index 0 is the annual income data
     * the user entered in the form. At pre rate check, type is not associated
     * with this income detail yet. Only on the employment question will type by assigned
     * ============================== *
     * Pre rate check, income detail at index 1 is the annual additional income data
     * the user entered in the form.  At pre rate check, type is not associated
     * with this income detail yet. Only on the employment question will type by assigned
     * ============================== *
     */
    const rateCheckIncomes: DecisionEntity["incomes"] = [
      {
        incomeType: "claimed_annual_income",
        value:
          incomeDetails[0] && !incomeDetails[0].type && incomeDetails[0].amount
            ? incomeDetails[0].amount
            : 0,
      },
      {
        incomeType: "annual_additional_income",
        value:
          incomeDetails[1] && !incomeDetails[1].type && incomeDetails[1].amount
            ? incomeDetails[1].amount
            : 0,
      },
    ];

    return rateCheckIncomes;
  }

  /**
   * Formats the income details of an application into a Decision Entity array of
   * Employment objects
   * @param incomeDetails Application Income details
   * @returns {DecisionEntity['employments']}
   */
  private applicantEmployment(
    incomeDetails: typings.Details["income"],
  ): DecisionEntity["employments"] | [] {
    const employments = this.filterIncomeDetails(
      incomeDetails,
      Object.values(EmploymentTypes),
    );
    if (!employments || (employments && employments.length === 0)) return [];

    return employments
      .filter((employment) => employment)
      .map((employment) => {
        let status = "";
        let amount = employment?.amount;
        if (employment?.type === "employment") {
          status = "employed";
          /**
           * ================================================ *
           * For a Future Employment, we collect Employer Name,
           * Job Title, and start date
           * =========================
           * For 'Self Employed', we only collect Job title,
           * Start Date and no Employer name
           * ================================================ */
          if (employment.title && employment.start) {
            if (employment.employer) {
              status = "future";
            } else {
              status = "self_employed";
            }
          }
        }
        if (employment?.type === "unspecified") {
          status = "unemployed";
          amount = 0;
        }
        return {
          employerName: employment?.employer,
          jobTitle: employment?.title,
          employmentStatus: status,
          ...(["self_employed", "future"].includes(status)
            ? {
                employmentStartDate: employment?.start
                  ? new Date(employment.start).toISOString()
                  : "",
              }
            : {}),
          amount: amount,
        };
      });
  }

  /**
   * Returns an Employment Decision object array specifically for a retired status applicant
   * @param incomeDetails Application Income Details
   * @param entityEmployemnts Decision Entity Employments
   * @param entityIncomes Decision Entity Incomes
   * @returns {DecisionEntity['employments']}
   */
  private applicantRetiredEmployment(
    incomeDetails: typings.Details["income"],
    entityEmployemnts: DecisionEntity["employments"],
    entityIncomes: DecisionEntity["incomes"],
  ): DecisionEntity["employments"] | [] {
    /* ============================== *
     * Special case for Retired status
     * ============================== *
     * If the `entityEmployemnts` is empty (income type != 'employment' or 'unspecified')
     * AND `entityIncomes` contains items, we assume user is `RETIRED`
     */
    if (
      entityEmployemnts &&
      entityEmployemnts.length === 0 &&
      entityIncomes &&
      entityIncomes.length > 0
    ) {
      return [
        {
          employerName: null,
          jobTitle: null,
          employmentStatus: "retired",
          // for a retired user, they may have entered an annual income at index 0 of income schema,
          // if there is a value, use that value instead of 0
          amount:
            incomeDetails && !incomeDetails[0]?.type && incomeDetails[0]?.amount
              ? incomeDetails[0].amount
              : 0,
        },
      ];
    }
    return [];
  }

  /**
   * Formats the income details of an application into a Decision Entity array of
   * Income objects
   * @param incomeDetails Application Income Details
   * @returns {DecisionEntity["incomes"]}
   */
  private applicantIncomes(
    incomeDetails: typings.Details["income"],
  ): DecisionEntity["incomes"] | [] {
    const incomes = this.filterIncomeDetails(
      incomeDetails,
      Object.values(IncomeTypes),
    );
    if (!incomes || (incomes && incomes.length === 0)) return [];
    return incomes
      .filter((income) => income)
      .map((income) => {
        return {
          incomeType: income?.type,
          value: income?.amount,
        };
      });
  }

  /**
   * Formats the asset details into a Decision Entity asset object array
   * @param assetDetails Application Asset details
   * @returns {DecisionEntity["assets"]}
   */
  private applicantAssets(
    assetDetails: typings.Details["asset"],
  ): DecisionEntity["assets"] | [] {
    if (assetDetails) {
      return assetDetails
        .filter((asset) => asset)
        .map((asset) => {
          return {
            assetType: asset?.type,
            value: asset?.amount,
          };
        });
    }
    return [];
  }

  /**
   * Formats the financial details to a Decision Entity financial info object array
   * @param financialAccountDetails Application Financial Details
   * @returns {DecisionEntity["financialInfo"]}
   */
  private async applicantFinancialInfo(
    input: Input<unknown>,
    context: PluginContext,
    financialAccountDetails: typings.Details["financialAccounts"],
  ): Promise<DecisionEntity["financialInfo"]> {
    const plaidTokens: Array<string> = [];
    let hasPlaid = false;
    let plaidAssetsReportId;
    let plaidRelayToken = "";
    const accounts = financialAccountDetails
      ?.filter((finAccount) => {
        if (finAccount?.selected) return finAccount;
      })
      .map((account) => {
        if (account?.plaidAccessToken) {
          hasPlaid = true;
          if (!plaidTokens.includes(account?.plaidAccessToken)) {
            plaidTokens.push(account?.plaidAccessToken);
          }
        }
        if (account?.plaidAssetsReportID && !plaidAssetsReportId) {
          plaidAssetsReportId = account?.plaidAssetsReportID;
        }
        return {
          accountType: "banking",
          accountSubType: account?.type,
          balance: account?.balance,
          accountInstitutionName: account?.institution_name
            ? account.institution_name
            : "",
        };
      });

    if (hasPlaid && plaidAssetsReportId) {
      const plaidClient = context.loadedPlugins.plaid?.instance;
      if (!plaidClient) {
        throw new Error("[91f2eddb] Plaid Service client instance not found");
      }
      plaidRelayToken = await plaidClient["createRelayToken"](
        context,
        input,
        "",
        {
          report_tokens: plaidAssetsReportId,
        },
      );
    }

    return {
      hasPlaid,
      ...(hasPlaid ? { plaidAccessTokens: plaidTokens, plaidRelayToken } : {}),
      ...(!hasPlaid
        ? {
            financialAccounts: accounts ? accounts : [],
          }
        : {}),
    };
  }

  /**
   * Formats the Rates information on an application to Decision Rates info object
   * @param application Application
   * @returns {DecisionEntity["ratesInfo"]}
   */
  private applicationRatesInfo(
    application: typings.Application,
  ): DecisionEntity["ratesInfo"] {
    return {
      rateMapVersion: application?.rateMapVersion
        ? application.rateMapVersion
        : "",
      rateMapTag: application?.rateMapTag ? application.rateMapTag : "default",
      rateAdjustmentData: {
        name: application?.partnerName ? application.partnerName : "",
        amount:
          application?.partnerDiscountAmount &&
          !Number.isNaN(Number(application?.partnerDiscountAmount))
            ? Number(application.partnerDiscountAmount)
            : 0,
      },
    };
  }

  /**
   * Given the application id, retreive application from Database
   * @param context PluginContext
   * @param applicationId Application ID
   * @returns {Promise<typings.Application>}
   */
  private async getApplication(
    context: PluginContext,
    applicationId: string,
  ): Promise<typings.Application> {
    const applicationServiceClient =
      context.loadedPlugins.applicationServiceClient?.instance;
    if (!applicationServiceClient)
      throw new Error(
        "[d5e6bc7f] Application Service client instance not found",
      );

    try {
      const { application: foundApp } = (await applicationServiceClient[
        "sendRequest"
      ](
        {
          query: TEMP_DEFAULT_APPLICATION_QUERY,
          variables: {
            id: applicationId,
            root: true,
          },
        },
        context,
      )) as unknown as { application: typings.Application };
      return foundApp;
    } catch (error) {
      this.log(
        {
          error,
          message: `[f2a66dcf] error while retrieving application`,
        },
        context,
      );
      throw error;
    }
  }

  /**
   * Performs a legacy data sync with the given monolith Loan, User, and Application IDs
   * @param input Contract input
   * @param context PluginContext
   * @param monolithIDs Monolith IDs of an application
   */
  private async legacyDataSync(
    input: Input<unknown>,
    context: PluginContext,
    monolithIDs: { [key: string]: string },
  ): Promise<void> {
    const internalRestServiceClient =
      context.loadedPlugins.internalRestServiceClient?.instance;
    if (!internalRestServiceClient)
      throw new Error(
        "[d78b6285] InternalRestServiceClient instance not found",
      );
    const { monolithLoanID, monolithUserID, monolithApplicationID } =
      monolithIDs;

    const { results, response } = await internalRestServiceClient["post"](
      {
        uri: "/apply-flow-service/apply",
        body: {
          loan_id: monolithLoanID,
          user_id: monolithUserID,
          application_id: monolithApplicationID,
          ...(input.request?.cookies?.device_uuid
            ? { device_id: input.request?.cookies?.device_uuid }
            : {}),
        },
      },
      context,
    );

    if (!response.statusCode || response.statusCode >= 400) {
      const error = new Error("Legacy data sync failed");
      internalRestServiceClient["log"](
        {
          error,
          level: "warn",
          results,
        },
        context,
      );
    }
  }

  /**
   * Set the application status to submitted upon sending decision request
   * @param context PluginContext
   * @param application Application
   * @param applicationId Application ID
   */
  private async setSubmittedStatus(
    context: PluginContext,
    application: typings.Application,
    applicationId: string,
  ): Promise<void> {
    const applicationServiceClient =
      context.loadedPlugins.applicationServiceClient?.instance;
    if (!applicationServiceClient)
      throw new Error(
        "[2e1fa00e] Application Service client instance not found",
      );
    const setStatusResult = (await applicationServiceClient["sendRequest"](
      {
        query: String.raw`mutation (
          $id: UUID!
          $meta: EventMeta
          $status: ApplicationStatusName!
        ) {
          setStatus(id: $id, meta: $meta, status: $status) {
            id,
            error,
          }
          ${
            application?.applicants?.map((applicant, i) =>
              applicant
                ? `
          setApplicantStatus_${i}: setStatus(id: "${applicant.id}", meta: $meta, status: $status) {
            id,
            error
          }
          `
                : "",
            ) || ""
          }
        }`,
        variables: {
          id: applicationId,
          status: "submitted",
          meta: { service: "apply-flow-service" },
        },
      },
      context,
    )) as { setStatus: { error: string | null } };

    const setStatusError = setStatusResult?.setStatus?.error;

    if (setStatusError) {
      const error = new Error("Failed to mark application as 'submitted'");
      context.logger.warn({
        message: setStatusError,
      });
      throw error;
    }
  }

  /**
   * Save the Lending Decision ID (token) for the Application
   * @param context PluginContext
   * @param applicationId Application ID
   * @param decisionToken Lending Decision ID
   */
  private async saveLendingDecisionId(
    context: PluginContext,
    applicationId: string,
    decisionToken: string,
    decisionType: string,
  ): Promise<void> {
    const applicationServiceClient =
      context.loadedPlugins.applicationServiceClient?.instance;
    if (!applicationServiceClient)
      throw new Error(
        "[b4d69fd7] Application Service client instance not found",
      );
    try {
      /* ============================== *
       * Saving the Decision ID as both
       * a compound detail and reference
       * ============================== */
      await applicationServiceClient["sendRequest"](
        {
          query: String.raw`mutation (
            $id: UUID!
            $details: AddDetailInput
            $meta: EventMeta
          ) {
            addDetails(details: $details, meta: $meta, id: $id) {
              id
            }
          }`,
          variables: {
            details: [
              {
                decisionID: decisionToken,
                type: decisionType,
              },
            ],
            id: applicationId,
          },
        },
        context,
      );
    } catch (error) {
      this.log(
        {
          error,
          message: `[1aaea07c] error saving decision id as detail`,
          stack: error.stack,
        },
        context,
      );
      throw error;
    }

    try {
      /* ============================== *
       * Saving the Decision ID as both
       * a compound detail and reference
       * ============================== */
      await applicationServiceClient["sendRequest"](
        {
          query: String.raw`mutation (
            $id: UUID!
            $references: [ReferenceInput]
            $meta: EventMeta
          ) {
            addReferences(id: $id, references: $references, meta: $meta) {
              id
            }
          }`,
          variables: {
            references: [
              {
                referenceType: "lendingDecisionID",
                referenceId: decisionToken,
              },
            ],
            id: applicationId,
          },
        },
        context,
      );
    } catch (error) {
      this.log(
        {
          error,
          message: `[a48d7973] error saving decision id as reference`,
          stack: error.stack,
        },
        context,
      );
      throw error;
    }
  }

  private filterPriceCurve(
    priceCurve: ArtifactGetResponse["data"]["artifacts"]["priceCurve"],
  ): Array<FilteredPrices> {
    return priceCurve
      .filter((price) => {
        if (Object.values(TermLengths).includes(price.term_months as number))
          return price;
      })
      .flatMap((price) => {
        return price.rates.map((rate) => {
          return {
            rate: Math.round(rate.rate * 100),
            rateType: rate.rate_type,
            term: price.term_months,
          };
        });
      });
  }
}
