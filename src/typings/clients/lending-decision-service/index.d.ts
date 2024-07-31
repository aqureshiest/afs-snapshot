import type { Plugin as ChassisPlugin } from "@earnest-labs/microservice-chassis/Plugin.js";
import type { PluginContext as ChassisPluginContext } from "@earnest-labs/microservice-chassis/PluginContext.js";
import * as typings from "@earnest/application-service-client/typings/codegen.js";
import type { HttpError as IHttpError } from "http-errors";

import type { default as LendingDecisionServiceClient } from "clients/lending-decision-service/index.js";
type LendingDecisionServicePlugin = ChassisPlugin<LendingDecisionServiceClient>;

import { WebhookTypeEnum } from "clients/lending-decision-service/index.js";
import { Input as IContractInput } from "contract/manifest.js";

interface IEntityInfo {
  firstName: typings.NameDetail["first"];
  lastName: typings.NameDetail["last"];
  dob: typings.Details["dateOfBirth"];
  addresses: Array<{
    addressLine1: typings.LocationDetail["street1"];
    addressLine2?: typings.LocationDetail["street2"];
    city: typings.LocationDetail["city"];
    state: typings.LocationDetail["state"];
    zip: typings.LocationDetail["zip"];
    type?: typings.LocationDetail["type"];
  }>;
  ssn?: typings.Application["ssnTokenURI"];
  email: typings.Details["email"];
  phoneNumber?: typings.PhoneDetail["number"];
  citizenshipStatus: typings.LocationDetail["citizenship"];
}

type IEducation = Array<{
  degreeType: typings.EducationDetail["degree"];
  endDate: typings.EducationDetail["termEnd"];
  startDate: typings.EducationDetail["termStart"];
  schoolName: string;
  schoolType: string;
  schoolCode: string;
  opeid: typings.EducationDetail["opeid"];
}>;

type IEmployment = Array<{
  employerName: typings.IncomeDetail["employer"];
  jobTitle: typings.IncomeDetail["title"];
  employmentStatus: typings.IncomeDetail["type"] | string;
  employmentStartDate?: typings.IncomeDetail["start"];
  employmentEndDate?: typings.IncomeDetail["end"];
  amount: typings.IncomeDetail["amount"];
  salary?: typings.IncomeDetail["amount"];
  employmentType?: typings.IncomeDetail["type"];
  verifiedSalary?: null;
  employmentEndingSoon?: boolean;
}>;

type IIncome = Array<{
  incomeType: typings.IncomeDetail["type"];
  value: typings.IncomeDetail["amount"];
  verifiedValue?: boolean;
}>;

type IAssets = Array<{
  assetType: typings.AssetDetail["type"];
  value: typings.AssetDetail["amount"];
  verifiedValue?: boolean;
}>;

type IFinancialDetails = {
  hasPlaid: boolean;
  plaidAccessTokens?: Array<string>;
  financialAccounts?: Array<{
    accountType: string;
    accountSubType: typings.FinancialAccountsDetail["type"];
    balance: typings.FinancialAccountsDetail["balance"];
    accountInstitutionName: typings.FinancialAccountsDetail["institution_name"];
  }>;
};

type IRatesDetails = {
  rateMapVersion: string;
  rateMapTag: string;
  rateAdjustmentData: {
    name: string;
    amount: number;
  };
};

interface IDecisionEntity {
  entityInfo: IEntityInfo;
  educations: IEducation;
  employments?: IEmployment;
  incomes: IIncome;
  assets: IAssets;
  financialInfo?: IFinancialDetails;
  ratesInfo: IRatesDetails;
  loanInfo: {
    claimedLoanAmount: typings.AmountDetail["requested"];
  };
}

interface IApplicationDecisionDetails {
  primary: IDecisionEntity;
  cosigner?: IDecisionEntity;
  parent?: IDecisionEntity;
}

interface IDecisionRequestDetails {
  product: string;
  decisioningWorkflowName: string;
  decisionSource?: string;
  applicationType: string;
  requestMetadata: {
    userId: string;
    applicationId: string;
  };
  isInternational: boolean;
  appInfo: IApplicationDecisionDetails;
}

interface IDecisionPostResponse {
  message: string;
  data: {
    decisioningToken: string;
    seedId: string;
    status: string;
    journeyApplicationStatus: string;
    decisionOutcome: string;
    journeyToken: string;
    journeyApplicationToken: string;
  };
}

interface IDecisionGetResponse {
  message: string;
  data: {
    decisioningToken: string;
    seedId: string;
    status: string;
    journeyApplicationStatus: string;
    requestedOn: string;
    decisionOutcome: string;
  };
}

export type IWebhookEventPayload = {
  data: {
    applicationId: string;
    decision: string;
    status?: string;
    entity?: {
      applicationRole: string;
      entityToken: string;
      status: string;
    };
    meta?: {
      userData: {
        primary: IEntityInfo & {
          livingSituation: string;
          claimedHousingPayment: number;
        };
        educationData: {
          primary: Array<
            IEducation & {
              monthsSinceResidency?: number | null;
              monthsSinceGraduation?: number;
              educationBeingFinanced: boolean;
              status: string;
            }
          >;
        };
        employmentData: IEmployment;
        incomes: IIncome;
        assets: IAssets;
        financialDetails: IFinancialDetails;
      };
    };
  };
  decisioningToken: string;
  webhookType: WebhookTypeEnum;
  journeyToken: string;
  journeyApplicationToken: string;
};

declare module "@earnest-labs/microservice-chassis/PluginContext.js" {
  interface LoadedPlugins {
    lendingDecisionServiceClient: LendingDecisionServicePlugin;
  }
}

declare module "clients/lending-decision-service/chassis-plugin.ts" {
  type Plugin = ChassisPlugin;
  type Context = ChassisPluginContext;
  type instance = LendingDecisionServiceClient;
}

declare module "../../../clients/lending-decision-service/index.js" {
  const enum PRODUCTS {
    SLR = "SLR",
    SLO = "SLO",
  }

  const enum APPLICANT_TYPES {
    Cosigner = "cosigner",
    Primary = "primary",
  }

  /**
   * TODO: use this interface for the `DecisionRequest` contract type to ensure consistent
   * interface for error handling / reporting
   */
  interface DecisionRequestMethod<U = unknown, O = unknown> {
    (
      this: LendingDecisionServiceClient,
      input: Input<unknown>,
      context: ChassisPluginContext,
      id: string,
      payload: U,
    ): Promise<{ errors: Array<Error | IHttpError>; results?: O }>;
  }

  type DecisionEntity = IDecisionEntity;
  type ApplicationDecisionDetails = IApplicationDecisionDetails;
  type DecisionRequestDetails = IDecisionRequestDetails;
  type DecisionPostResponse = IDecisionPostResponse;
  type DecisionGetResponse = IDecisionGetResponse;
  type WebhookEventPayload = IWebhookEventPayload;
  type Input<I> = IContractInput<I>;
  type HttpError = IHttpError;
}
