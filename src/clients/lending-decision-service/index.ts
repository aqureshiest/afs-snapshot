import PluginContext from "@earnest-labs/microservice-chassis/PluginContext.js";
import { TEMP_DEFAULT_APPLICATION_QUERY } from "../application-service/graphql.js";
import * as typings from "@earnest/application-service-client/typings/codegen.js";
import flattenApplication from "../../api/helpers.js";
import assert from "node:assert";
import { TrackParams } from "@segment/analytics-node";
import Client from "../client.js";
import {
  mapIncomeTypeToEmplStatus,
  mapLoanType,
} from "../../contract/template-helpers/index.js";
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
}

enum DecisionStatusMapping {
  APPROVED = "approved",
  DECLINED = "declined",
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
    input: Input,
    context: PluginContext,
    id: string,
    payload: WebhookEventPayload,
  ): Promise<void> {
    const { data, webhookType } = payload;
    const { decision, entity, status } = data;

    if (!input.auth?.internal?.isValid) {
      this.error(input, "unauthorized");
      return;
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
      const result = (await applicationServiceClient.sendRequest({
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
        await applicationServiceClient.sendRequest({
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
        /**
         * Call analytics here to track app status
         */
        try {
          const analyticsServiceClient =
            context?.loadedPlugins?.analyticsServiceClient?.instance;
          assert(
            analyticsServiceClient,
            "[c651a7e7] AnalyticsServiceClient not instantiated",
          );
          const trackProps = {
            userId: input.auth?.session?.userId,
            event: "Server Loan Decisioned",
            properties: {
              product: "slr",
              application_id: application.root.id,
              employment_type: mapIncomeTypeToEmplStatus(
                application.details.income,
              ),
              section: "income",
              source: "application",
              loan_type: mapLoanType(application.tag.applicants),
              decision: status,
            },
          } as unknown as TrackParams;
          setImmediate(async () => {
            await analyticsServiceClient["track"](trackProps);
          });
        } catch (error) {
          this.log(
            {
              error,
              message: `[1659956d] Segment Event Loan Decisioned failed`,
              stack: error.stack,
            },
            context,
          );
        }
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
    input: Input,
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
      },
      context,
    );

    if (response.statusCode && response.statusCode >= 400) {
      const error = new Error(
        `[31b3882a] Failed to get decision: ${response.statusMessage}`,
      );
      context.logger.error({
        error,
        message: response.statusMessage, // Log the actual status message from LDS
        statusCode: response.statusCode,
      });
      throw error;
    }

    return results;
  }

  /**
   * Sends a POST request on the decision endpoint to LDS
   * @param context PluginContext
   * @param applicationId string Root Application ID
   * @returns {Promise<DecisionPostResponse>}
   */
  async postDecisionRequest(
    input: Input,
    context: PluginContext,
    applicationId: string, // Assuming root app ID
    payload = {}, // eslint-disable-line @typescript-eslint/no-unused-vars,
  ): Promise<DecisionPostResponse> {
    const applicationServiceClient =
      context.loadedPlugins.applicationServiceClient?.instance;
    const internalRestServiceClient =
      context.loadedPlugins.internalRestServiceClient.instance;

    if (!applicationServiceClient)
      throw new Error(
        "[45ff82b1] Application Service client instance not found",
      );

    if (!internalRestServiceClient)
      throw new Error(
        "[d78b6285] InternalRestServiceClient instance not found",
      );

    let application: typings.Application = {} as typings.Application;
    const applicationDecisionDetails = {};

    try {
      const { application: foundApp } =
        (await applicationServiceClient.sendRequest(
          {
            query: TEMP_DEFAULT_APPLICATION_QUERY,
            variables: {
              id: applicationId,
              root: true,
            },
          },
          context,
        )) as unknown as { application: typings.Application };
      application = foundApp;
    } catch (error) {
      this.log(
        {
          error,
          message: `[6d352332] error while retrieving application`,
        },
        context,
      );
      throw error;
    }
    application = flattenApplication(application);

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
      const { results, response } = await internalRestServiceClient.post(
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
        internalRestServiceClient.log(
          {
            error,
            level: "warn",
            results,
          },
          context,
        );
      }
    }

    /* ============================== *
     * TODO: applications with multiple applicants will need more information
     * to determine which applicants are submitted
     * ============================== */

    const setStatusResult = (await applicationServiceClient.sendRequest(
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

    const { results, response } = await this.post<DecisionPostResponse>(
      {
        uri: "/v2/decision",
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
          error,
          message: response.statusMessage, // Log the actual status message from LDS
          statusCode: response.statusCode,
        },
        context,
      );
      throw error;
    }

    try {
      await applicationServiceClient.sendRequest(
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
                referenceId: results.data.decisioningToken,
              },
            ],
            id: applicationId,
          },
        },
        context,
      );

      /**
       * Store the lending decision token as a reference
       */
    } catch (error) {
      this.log(
        {
          error,
          message: `[6a91cce5] error while retrieving application`,
          stack: error.stack,
        },
        context,
      );
      throw error;
    }

    try {
      const analyticsServiceClient =
        context?.loadedPlugins?.analyticsServiceClient?.instance;
      assert(
        analyticsServiceClient,
        "[6658663e] AnalyticsServiceClient not instantiated",
      );
      const trackProps = {
        userId: input.auth?.session?.userId,
        event: "Server Loan Decisioned",
        properties: {
          product: "slr",
          application_id: applicationId,
          employment_type: mapIncomeTypeToEmplStatus(
            application?.details?.income,
          ),
          section: "income",
          source: "application",
          loan_type: mapLoanType(application?.["tag"]?.applicants),
          decision: results.data.status,
        },
      } as unknown as TrackParams;
      setImmediate(async () => {
        await analyticsServiceClient["track"](trackProps);
      });
    } catch (error) {
      this.log(
        {
          error,
          message: `[1659956d] Segment Event Loan Decisioned failed`,
          stack: error.stack,
        },
        context,
      );
    }
    return results;
  }

  /**
   * Private method to format the application data into the
   * defined payload contract structure for Lending Decision Service
   * @param context PluginContext
   * @param application IApplicationFragment
   * @returns {DecisionEntity}
   */
  private async formatRequestPayload(
    input: Input,
    context: PluginContext,
    application: typings.Application,
    applicant: string,
  ) {
    const { details } = application[applicant];
    const applicantSSN = application[applicant].ssnTokenURI
      ? application[applicant].ssnTokenURI
      : "";

    const accreditedSchoolService =
      context.loadedPlugins.accreditedSchoolService?.instance;

    if (!accreditedSchoolService)
      throw new Error(
        "[964e8743] Accredited School Service client instance not found",
      );
    if (!details) {
      throw new Error(
        "[42b4cf11] Unable to parse application detail information",
      );
    }

    /**
     * Format the location details to addresses array
     */
    const addresses = details?.location?.map((location) => {
      if (!location || (location && Object.keys(location).length === 0)) {
        return {};
      }
      return {
        addressLine1: location.street1,
        addressLine2: location.street2 ? location.street2 : "",
        city: location.city,
        state: location.state,
        zip: location.zip,
        country: "US", // TODO: get country if/when we process International applicants
        type: location.type,
      };
    });

    let citizenshipStatus =
      details.location && details.location.length > 0
        ? details.location.find((location) => location?.type === "primary")
            ?.citizenship
        : "";

    if (citizenshipStatus === "citizen") {
      // LDS expects 'us_citizen' instead. After V1, we should
      // align on one standard for describing a US citizen
      citizenshipStatus = "us_citizen";
    } else if (citizenshipStatus === "non-resident") {
      // LDS expects 'other' instead. After V1, we should
      // align on one standard for describing a non-resident
      citizenshipStatus = "other";
    }

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

    /**
     * Format the education details
     */
    const schoolDetails: Promise<{
      [key: string]: unknown;
    }>[] =
      details?.education?.map(async (education) => {
        if (!education || (education && Object.keys(education).length === 0)) {
          return {};
        }

        const searchedSchool = (
          await accreditedSchoolService["getSchools"](input, context, {
            opeid: education.opeid,
          })
        )?.[0];

        if (!searchedSchool) {
          throw new Error(
            `[97816200] failed to get School with id ${education.opeid}`,
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
          degreeType: education.degree ? education.degree : "none",
          endDate: education.graduationDate
            ? new Date(education.graduationDate).toISOString()
            : "",
          schoolName: foundSchool.name,
          schoolCode: `${foundSchool.id}`,
          schoolType: foundSchool.forProfit ? "for_profit" : "not_for_profit",
          opeid: education.opeid,
        };
      }) || [];

    const educationDetails = await Promise.all(schoolDetails);

    /**
     * Format the employment details
     */
    const otherIncomeTypes = [
      "investment",
      "social_security_or_pension",
      "child_support_or_alimony",
      "rental",
      "k1",
      "disability",
    ];
    const employmentTypes = ["employment", "unspecified"];
    let employmentDetails = details?.income
      .filter((income) => {
        if (employmentTypes.includes(income?.type as string)) return income;
      })
      .map((employment) => {
        if (
          !employment ||
          (employment && Object.keys(employment).length === 0)
        ) {
          return {};
        }

        let status;
        let amount = employment.amount;
        if (employment.type === "employment") {
          status = "employed";
          /**
           * ================================================
           * For a Future Employment, we collect Employer Name,
           * Job Title, and start date
           * =========================
           * For 'Self Employed', we only collect Job title,
           * Start Date and no Employer name
           */
          if (employment.title && employment.start) {
            if (employment.employer) {
              status = "future";
            } else {
              status = "self_employed";
            }
          }
        }
        if (employment.type === "unspecified") {
          status = "unemployed";
          amount = 0;
        }
        return {
          employerName: employment.employer,
          jobTitle: employment.title,
          employmentStatus: status,
          ...(["self_employed", "future"].includes(status)
            ? {
                employmentStartDate: employment.start
                  ? new Date(employment.start).toISOString()
                  : "",
              }
            : {}),
          amount: amount,
        };
      });

    /**
     * Format the incomes
     */
    let otherIncomeDetails;
    if (details?.income) {
      otherIncomeDetails = details.income
        .filter((income) => {
          if (otherIncomeTypes.includes(income?.type as string)) return income;
        })
        .map((income) => {
          if (!income || (income && Object.keys(income).length === 0)) {
            return {};
          }

          return {
            incomeType: income.type,
            value: income.amount,
          };
        });
    }

    /* ===============================
     * Special case for Retired status
     * ===============================
     * If the `employmentDetails` is empty (income type != 'employment' or 'unspecified)
     * AND `otherIncomeDetails` contains items, we assume user is `RETIRED`
     */
    if (employmentDetails.length <= 0 && otherIncomeDetails.length > 0) {
      employmentDetails = [
        {
          employerName: null,
          jobTitle: null,
          employmentStatus: "retired",
          // for retired user, they may have entered an annual income at index 0 of income schema,
          // if there, use that value instead of 0
          amount:
            !details?.income[0].type && details?.income[0].amount
              ? details?.income[0].amount
              : 0,
        },
      ];
    }

    /**
     * Format assets
     */
    let assetsDetails;
    if (details?.asset) {
      assetsDetails = details.asset.map((asset) => {
        return {
          assetType: asset?.type,
          value: asset?.amount,
        };
      });
    }
    /**
     * Format the financial accounts
     */
    const plaidTokens: Array<string> = [];
    let hasPlaid = false;
    let financialAccountDetails;

    if (details?.financialAccounts) {
      financialAccountDetails = details.financialAccounts
        .filter((finAccount) => {
          if (finAccount?.selected) return finAccount;
        })
        .map((account) => {
          if (account?.plaidAccessToken) {
            hasPlaid = true;
            if (!plaidTokens.includes(account?.plaidAccessToken)) {
              plaidTokens.push(account?.plaidAccessToken);
            }
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
    }

    /**
     * The end result formatted for LDS
     */
    const formattedPayload = {
      entityInfo: entityDetails,
      educations: educationDetails,
      employments: employmentDetails,
      incomes: otherIncomeDetails ? otherIncomeDetails : [],
      assets: assetsDetails ? assetsDetails : [],
      loanInfo: {
        claimedLoanAmount: application.details?.amount?.requested,
      },
      financialInfo: {
        hasPlaid,
        ...(hasPlaid ? { plaidAccessTokens: plaidTokens } : {}),
        ...(!hasPlaid
          ? {
              financialAccounts: financialAccountDetails
                ? financialAccountDetails
                : [],
            }
          : {}),
      },
      /**
       * TODO:
       * Rates need to be pulled from partner-api which is something that
       * Apply flow shouldn't handle. In v2 need to determine where to get this
       * Hard code for now:
       */
      ratesInfo: {
        rateMapVersion: application?.rateMapVersion
          ? application.rateMapVersion
          : "188.1",
        rateMapTag: application?.rateMapTag
          ? application.rateMapTag
          : "default",
        rateAdjustmentData: {
          name: application?.partnerName ? application.partnerName : "juno",
          amount:
            application?.partnerDiscountAmount &&
            !Number.isNaN(Number(application?.partnerDiscountAmount))
              ? Number(application.partnerDiscountAmount)
              : 0,
        },
      },
    };
    return formattedPayload;
  }

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
}
