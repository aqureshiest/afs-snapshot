import PluginContext from "@earnest-labs/microservice-chassis/PluginContext.js";
import { TEMP_DEFAULT_APPLICATION_QUERY } from "../application-service/graphql.js";
import * as typings from "@earnest/application-service-client/typings/codegen.js";
import { Client } from "@earnest/http";
import flattenApplication from "../../api/helpers.js";

export default class LendingDecisionServiceClient extends Client {
  private accessKey: string;

  constructor(accessKey: string, baseUrl: string) {
    const options = { baseUrl };
    super(options);
    this.accessKey = accessKey;
  }

  get headers() {
    return {
      ...super.headers,
      "Content-Type": "application/json",
      Accept: "application/json",
    };
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
  ): Promise<DecisionGetResponse> {
    if (!lendingDecisionId) {
      throw new Error("[3144deaa] missing lending decision id");
    }

    const { results, response } = await this.get<DecisionGetResponse>({
      uri: `/v1/decision/${lendingDecisionId}`,
    });

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
          },
        })) as unknown as { application: typings.Application };
      application = foundApp;
    } catch (error) {
      context.logger.error({
        error,
        message: `[6d352332] error while retrieving application`,
        stack: error.stack,
      });
      throw error;
    }

    application = flattenApplication(application);

    for (const applicant of [
      APPLICANT_TYPES.Primary,
      APPLICANT_TYPES.Cosigner,
    ]) {
      if (application[applicant]) {
        applicationDecisionDetails[applicant] = this.formatRequestPayload(
          application[applicant] as typings.Application,
        );
      }
    }

    const payload = {
      product: "SLR",
      decisioningWorkflowName: "AUTO_APPROVAL",
      decisionSource: "apply-flow-service",
      applicationType: "PRIMARY_ONLY",
      requestMetadata: {
        applicationId,
        userId: application.monolithUserID,
      },
      isInternational: false, // TODO: FOR Decision, what happens if international and SSNs?
      appInfo: applicationDecisionDetails,
    } as unknown as DecisionRequestDetails;

    const { results, response } = await this.post<DecisionPostResponse>({
      uri: "/v2/decision",
      headers: {
        ...this.headers,
        Authorization: `Bearer ${this.accessKey}`,
      },
      payload,
      resiliency: {
        attempts: 3,
        delay: 100,
        timeout: 10000,
        test: ({ response }) =>
          Boolean(response.statusCode && response.statusCode <= 500),
      },
    });

    if (response.statusCode && response.statusCode >= 400) {
      const error = new Error(
        `[a571403f] Failed to post decision: ${response.statusMessage}`,
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
   * Private method to format the application data into the
   * defined payload contract structure for Lending Decision Service
   * @param context PluginContext
   * @param application IApplicationFragment
   * @returns {DecisionEntity}
   */
  private formatRequestPayload(application: typings.Application) {
    const { details } = application;

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
        addressLine2: location.street2,
        city: location.city,
        state: location.state,
        zip: location.zip,
        type: location.type,
      };
    });

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
      citizenshipStatus:
        details.location && details.location.length > 0
          ? details.location.find((location) => location?.type === "primary")
              ?.citizenship
          : "",
    };

    const educationDetails = details?.education?.map((education) => {
      if (!education || (education && Object.keys(education).length === 0)) {
        return {};
      }

      return {
        degreeType: education.degree,
        endDate: education.graduationDate
          ? new Date(education.graduationDate).toISOString()
          : "",
        status: education.enrollment,
        // TODO: schoolName: education.name,
        opeid: education.opeid,
      };
    });

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
         * TODO: Determine employment status. We'll be storing only 'employed' or 'misc' (for unemployed)
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
          employmentStartDate: employment?.start
            ? new Date(employment.start).toISOString()
            : "",
          amount: employment.amount,
        };
      });

    const otherIncomeDetails = details?.income
      ?.filter((income) => {
        if (!employmentStatuses.includes(income?.type as string)) return income;
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

    const assetsDetails = details?.asset?.map((asset) => {
      return {
        assetType: asset?.type,
        value: asset?.amount,
      };
    });

    const formattedPayload = {
      entityInfo: entityDetails,
      educations: educationDetails,
      employments: employmentDetails,
      incomes: otherIncomeDetails,
      assets: assetsDetails,
      loanInfo: {
        claimedLoanAmount: details.amount?.requested,
      },
      // need rates
    };
    return formattedPayload;
  }
}
