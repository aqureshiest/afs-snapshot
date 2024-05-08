import PluginContext from "@earnest-labs/microservice-chassis/PluginContext.js";
import { TEMP_DEFAULT_APPLICATION_QUERY } from "../application-service/graphql.js";
import * as typings from "@earnest/application-service-client/typings/codegen.js";
import flattenApplication from "../../api/helpers.js";

import Client from "../client.js";

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
    context: PluginContext,
    id: string,
    payload: WebhookEventPayload,
  ): Promise<void> {
    const { data, webhookType } = payload;
    const { decision, entity, status } = data;

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
    try {
      const result = (await applicationServiceClient.sendRequest({
        query: String.raw`query Applications($criteria: [ApplicationSearchCriteria]!) {
          applications(criteria: $criteria) {
            id
            root {
              id
            }
            primary {
              id
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
    context: PluginContext,
    applicationId: string, // Assuming root app ID
    payload = {}, // eslint-disable-line @typescript-eslint/no-unused-vars,
  ): Promise<DecisionPostResponse> {
    const applicationServiceClient =
      context.loadedPlugins.applicationServiceClient?.instance;

    if (!applicationServiceClient)
      throw new Error(
        "[45ff82b1] Application Service client instance not found",
      );

    let application: typings.Application = {} as typings.Application;
    const applicationDecisionDetails = {};

    try {
      const { application: foundApp } =
        (await applicationServiceClient.sendRequest({
          query: TEMP_DEFAULT_APPLICATION_QUERY,
          variables: {
            id: applicationId,
            root: true,
          },
        })) as unknown as { application: typings.Application };
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
          context,
          application[applicant] as typings.Application,
          application.details?.amount?.requested,
        );
      }
    }

    const decisionPayload = {
      product: "SLR", // TODO: For v2 use application.product where can be string 'student-refi' or 'student-origination'
      decisioningWorkflowName: "AUTO_APPROVAL",
      decisionSource: "apply-flow-service",
      applicationType: "PRIMARY_ONLY", // TODO: For v2 use application.tags where can be string ['primary_only','cosigned', 'parent_plus']
      requestMetadata: {
        applicationId:
          application[APPLICANT_TYPES.Primary]?.monolithApplicationID, // TODO: LA-562 Temporarily pass the monolithApplicationId to Decision
        userId: application[APPLICANT_TYPES.Primary]?.monolithUserID
          ? application[APPLICANT_TYPES.Primary].monolithUserID
          : application?.monolithUserID,
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
          timeout: 20000,
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

    let decisioningStatus;
    if (results && results.data.decisionOutcome) {
      const { decisionOutcome } = results.data;

      switch (decisionOutcome) {
        case AlloyDecision.DENIED:
          decisioningStatus = DecisionStatusMapping.DECLINED;
          break;

        case AlloyDecision.APPROVED:
          decisioningStatus = DecisionStatusMapping.APPROVED;
          break;
      }
    }

    try {
      await applicationServiceClient.sendRequest(
        {
          query: String.raw`mutation (
            $id: UUID!
            $references: [ReferenceInput]
            $meta: EventMeta
            $status: ApplicationStatusName!
          ) {
            addReferences(id: $id, references: $references, meta: $meta) {
              id
              application {
                id
              }
            }
            setStatus(id: $id, meta: $meta, status: $status) {
              id
              application {
                id
              }
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
            status: "submitted",
          },
        },
        context,
      );

      if (decisioningStatus) {
        await applicationServiceClient.sendRequest(
          {
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
              id: applicationId,
              status: decisioningStatus,
            },
          },
          context,
        );
      }
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
    context: PluginContext,
    application: typings.Application,
    loanAmount: typings.AmountDetail["requested"],
  ) {
    const { details } = application;

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
        country: "US",
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
      ssn: application.ssnTokenURI ? application.ssnTokenURI : "",
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

        const foundSchool = await accreditedSchoolService["getSchool"](
          context,
          { id: education.opeid },
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
    const employmentStatuses = [
      "employed",
      "self_employed",
      "future",
      "retired",
      "unemployed",
    ];
    const employmentDetails = details?.income
      ?.filter((employment) => {
        if (employmentStatuses.includes(employment?.type as string))
          return employment;
      })
      .map((employment) => {
        if (
          !employment ||
          (employment && Object.keys(employment).length === 0)
        ) {
          return {};
        }

        /**
         * TODO: For v2 determine employment status. We'll be storing only 'employed' or 'misc' (for unemployed)
         * need to determine if 'employed' is 'self-employed' or 'future'
         * need to determine if 'retired'
         */
        // let status;
        // const now = new Date()
        // if (employment.type === 'employed') {
        //   status = 'employed'
        //   // For a 'Self Employed' status, we only collect a Job title and a Start Date and no Employer name
        //   // If we have a start date that is in the past and a job title, user is self employed
        //   if ((!employment.employer) && employment.title && (employment.start && ((new Date(employment.start)) < now))) {
        //     status = 'self_employed'
        //   }
        //   // For a Future Employment, we collect Employer Name, Job Title, and start date
        //   // If start date is in the future, user is Future employed
        //   if((new Date(employment.start)) > now) {
        //     status = 'future'
        //   }
        // }
        // if (employment.type === 'misc') {
        //   status = 'unemployed'
        // }
        // if (employment.type === 'social_security_or_pension') {
        //   status = 'retired'
        // }
        return {
          employerName: employment.employer,
          jobTitle: employment.title,
          employmentStatus: employment.type,
          ...(["self_employed", "future"].includes(employment?.type as string)
            ? {
                employmentStartDate: employment.start
                  ? new Date(employment.start).toISOString()
                  : "",
              }
            : {}),
          amount: employment.amount,
        };
      });

    /**
     * Format the incomes
     */
    let otherIncomeDetails;
    if (details?.income) {
      otherIncomeDetails = details.income
        .filter((income) => {
          if (!employmentStatuses.includes(income?.type as string))
            return income;
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
      financialAccountDetails = details.financialAccounts.map((account) => {
        if (account?.plaidAccessToken) {
          hasPlaid = true;
          plaidTokens.push(account?.plaidAccessToken);
        }
        return {
          accountType: "banking",
          accountSubType: account?.type,
          balance: account?.balance,
          accountInstitutionName: account?.institution_name,
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
        claimedLoanAmount: loanAmount,
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
        rateMapVersion: "188.1",
        rateMapTag: "default",
        rateAdjustmentData: {
          name: "juno",
          amount: 0,
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
