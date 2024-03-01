import PluginContext from "@earnest-labs/microservice-chassis/PluginContext.js";
import { TEMP_DEFAULT_APPLICATION_QUERY } from "../application-service/graphql.js";
import * as typings from "@earnest/application-service-client/typings/codegen.js";
import { Client } from "@earnest/http";

export default class LendingDecisionServiceClient extends Client {
  private accessKey: string;

  constructor(context: PluginContext, accessKey: string, baseUrl: string) {
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

    const piiTokenService = context.loadedPlugins.piiTokenService?.instance;

    if (!applicationServiceClient)
      throw new Error(
        "[45ff82b1] Application Service client instance not found",
      );

    if (!piiTokenService) {
      throw new Error("[61e82544] PII Token Service client instance not found");
    }

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

    if (application !== null && application.applicants) {
      // flatten application
      if (application.applicants.length == 1) {
        application.primary = application.applicants[0];
        // decrypt the SSN for the formatter. Do it here instead of making another post request
        // deep inside the formatter function

        const primaryApplicant = {
          ...application.applicants[0],
          ssn: await piiTokenService["getTokenValue"](
            application.applicants[0] ? application.applicants[0]["ssn"] : "",
          ),
        };

        applicationDecisionDetails["primary"] = this.formatRequestPayload(
          application?.product,
          primaryApplicant as typings.Application,
        );
      } else {
        application.applicants.forEach((applicant) => {
          const relationshipNotRoot =
            applicant?.relationships?.filter(
              (r) => r?.relationship !== "root",
            ) || [];

          if (relationshipNotRoot.length) {
            relationshipNotRoot.forEach(async (relationship) => {
              const app = application?.applicants?.find(
                (a) => a?.id === relationship?.id,
              );
              if (
                app &&
                application &&
                relationship &&
                relationship.relationship
              ) {
                // decrypt the SSN for the formatter. Do it here instead of making another post request
                // deep inside the formatter function
                const updatedApplicant = {
                  ...app,
                  ssn: await piiTokenService["getTokenValue"](
                    app ? app["ssn"] : "",
                  ),
                };

                applicationDecisionDetails[relationship.relationship] =
                  this.formatRequestPayload(
                    application?.product,
                    updatedApplicant as typings.Application,
                  );
              }
            });
          }
        });
      }
    }

    const payload = {
      product: application?.product,
      decisioningWorkflowName: "AUTO_APPROVAL",
      applicationType:
        application?.tags && application?.tags.length > 0
          ? application?.tags[0]
          : "", // Use application tags to find application type
      requestMetadata: {
        applicationId,
      },
      isParentPlus: false,
      isInternational: false,
      isMedicalResidency: false,
      appInfo: applicationDecisionDetails,
    } as DecisionRequestDetails;

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
  private formatRequestPayload(
    product: typings.Maybe<string> | undefined,
    application: typings.Application,
  ) {
    const { details } = application;

    if (!details) {
      throw new Error(
        "[42b4cf11] Unable to parse application detail information",
      );
    }

    const addresses = details?.location?.map((location) => {
      if (!location || (location && Object.keys(location).length === 0)) {
        return {};
      }

      return {
        addressLine1: location.street1,
        addressLine2: location.street2,
        city: location.city,
        state: location.state,
        /**
         * TODO:
         *    Once we add mechanisim to add multiple addresses
         *    Ensure there is a way to signify primary vs not primary address
         *    For now, we take first address and mark as primary address
         *    LDS needs to know what address is the primary address
         */
        type: location["type"],
      };
    });

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

    const employmentDetails = details?.income
      ?.filter((employment) => {
        if (employment?.type === "employment") return employment;
      })
      .map((employment) => {
        if (
          !employment ||
          (employment && Object.keys(employment).length === 0)
        ) {
          return {};
        }

        // Only obtain income details if the employer field is present
        return {
          employerName: employment.employer,
          jobTitle: employment.title,
          employmentType: employment.type,
          employmentStartDate: employment?.start
            ? new Date(employment.start).toISOString()
            : "",
          employmentEndDate: employment?.end
            ? new Date(employment.end).toISOString()
            : "",
        };
      });

    const otherIncomeDetails = details?.income
      ?.filter((income) => {
        if (income?.type !== "employment") return income;
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

    const formattedPayload = {
      entityInfo: {
        firstName: details.name?.first || "",
        lastName: details.name?.last || "",
        dob: details.dateOfBirth
          ? new Date(details.dateOfBirth).toISOString()
          : "",
        addresses,
        ssn: application.ssn ? application.ssn : "",
        email: details?.email || "",
        phoneNumber:
          details.phone?.find(
            (phoneDetail) => phoneDetail && phoneDetail.number,
          )?.number || "", // get first non-null number
        // TODO: citizenshipStatus: details.location.find((location) => location?.type === 'primary').citizenship,
        citizenshipStatus:
          details.location && details.location.length > 0
            ? details?.location[0]?.citizenship || ""
            : "",
      },
      educations: educationDetails,
      employments: employmentDetails,
      incomes:
        otherIncomeDetails && otherIncomeDetails.length > 0
          ? otherIncomeDetails
          : [
              {
                incomeType: "annual_additional_income",
                value: 0,
              },
            ],
      assets:
        product === PRODUCTS.SLR
          ? otherIncomeDetails
          : [
              {
                assetType: "claimed_total_assets",
                value: 0, // for Origination, we do not ask for assets, so send total as 0 to LDS
              },
            ],
      loanInfo: {
        claimedLoanAmount: details.amount?.requested,
      },
      servicingInfo: {
        // TODO: Send false and 0 data here until we get servicing client up
        hasActiveLoan: false,
        aggregateLoanTotal: 0,
        hasActiveLoanCurrentYear: false,
      },
    };
    return formattedPayload;
  }
}
