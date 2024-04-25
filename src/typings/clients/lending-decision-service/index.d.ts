import type { Plugin as ChassisPlugin } from "@earnest-labs/microservice-chassis/Plugin.js";
import type { PluginContext as ChassisPluginContext } from "@earnest-labs/microservice-chassis/PluginContext.js";
import type { default as LendingDecisionServiceClient } from "clients/lending-decision-service/index.js";
import * as typings from "@earnest/application-service-client/typings/codegen.js";

type LendingDecisionServicePlugin = ChassisPlugin<LendingDecisionServiceClient>;
interface IDecisionEntity {
  entityInfo: {
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
  };
  educations: Array<{
    degreeType: typings.EducationDetail["degree"];
    endDate: typings.EducationDetail["termEnd"];
    schoolName: string;
    schoolType: string;
    schoolCode: string;
    opeid: typings.EducationDetail["opeid"];
  }>;
  employments: Array<{
    employerName?: typings.IncomeDetail["employer"];
    jobTitle: typings.IncomeDetail["title"];
    employmentStatus: typings.IncomeDetail["type"];
    employmentStartDate: typings.IncomeDetail["start"];
    amount: typings.IncomeDetail["amount"];
  }>;
  incomes: Array<{
    incomeType: typings.IncomeDetail["type"];
    value: typings.IncomeDetail["amount"];
  }>;
  assets: Array<{
    assetType: typings.AssetDetail["type"];
    value: typings.AssetDetail["amount"];
  }>;
  financialInfo: {
    hasPlaid: boolean;
    plaidAccessTokens?: Array<string>;
    financialAccounts?: Array<{
      accountType: string;
      accountSubType: typings.FinancialAccountsDetail["type"];
      balance: typings.FinancialAccountsDetail["balance"];
      accountInstitutionName: typings.FinancialAccountsDetail["institution_name"];
    }>;
  };
  ratesInfo: {
    rateMapVersion: string;
    rateMapTag: string;
    rateAdjustmentData: {
      name: string;
      amount: number;
    };
  };
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
  decisioningToken: string;
  seedId: string;
  status: string;
  journeyApplicationStatus: string;
  decisionOutcome: string;
  journeyToken: string;
  journeyApplicationToken: string;
}

interface IDecisionGetResponse {
  decisioningToken: string;
  seedId: string;
  status: string;
  journeyApplicationStatus: string;
  requestedOn: string;
  decisionOutcome: string;
}

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

  type DecisionEntity = IDecisionEntity;
  type ApplicationDecisionDetails = IApplicationDecisionDetails;
  type DecisionRequestDetails = IDecisionRequestDetails;
  type DecisionPostResponse = IDecisionPostResponse;
  type DecisionGetResponse = IDecisionGetResponse;
}
