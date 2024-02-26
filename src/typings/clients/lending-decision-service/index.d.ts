import type { Plugin as ChassisPlugin } from "@earnest-labs/microservice-chassis/Plugin.js";
import type { PluginContext as ChassisPluginContext } from "@earnest-labs/microservice-chassis/PluginContext.js";
import type { default as LendingDecisionServiceClient } from "clients/lending-decision-service/index.js";

type LendingDecisionServicePlugin = ChassisPlugin<LendingDecisionServiceClient>;
interface IDecisionEntity {
  entityInfo: {
    firstName: string;
    lastName: string;
    dob: string;
    addresses: Array<{
      addressLine1?: string;
      addressLine2?: string;
      city?: string;
      state?: string;
      country?: string;
    }>;
    ssn?: string;
    email: string;
    phoneNumber?: string;
    citizenshipStatus: string;
  };
  educations: Array<{
    degreeType: string;
    startDate?: Date;
    endDate: Date;
    status: string;
    schoolName: string;
    schoolCode?: string;
    opeid?: string;
  }>;
  employments: Array<{
    employerName: string;
    jobTitle: string;
    employmentType?: string;
    employmentStartDate: Date;
    employmentEndDate: Date;
    employmentEndingSoon?: boolean;
    salary?: number;
  }>;
  incomes: Array<{
    incomeType: string;
    value: number;
  }>;
  assets: Array<{
    assetType: string;
    value: number;
  }>;
  loanInfo: {
    claimedLoanAmount: number;
  };
  servicingInfo: {
    hasActiveLoan: boolean;
    aggregateLoanTotal: number;
    hasActiveLoanCurrentYear: boolean;
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
  applicationType: string;
  requestMetadata: {
    applicationId: string;
  };
  isParentPlus: boolean;
  isInternational: boolean;
  isMedicalResidency: boolean;
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

  type DecisionEntity = IDecisionEntity;
  type ApplicationDecisionDetails = IApplicationDecisionDetails;
  type DecisionRequestDetails = IDecisionRequestDetails;
  type DecisionPostResponse = IDecisionPostResponse;
  type DecisionGetResponse = IDecisionGetResponse;
}
