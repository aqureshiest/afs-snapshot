import type { Plugin as ChassisPlugin } from "@earnest-labs/microservice-chassis/Plugin.js";
import type { PluginContext as ChassisPluginContext } from "@earnest-labs/microservice-chassis/PluginContext.js";
import AccreditedSchoolServiceClient from "clients/accredited-school-service/index.js";
type AccreditedSchoolServicePlugin =
  ChassisPlugin<AccreditedSchoolServiceClient>;
type ILoanType = "slo" | "slr";

type ISchool = {
  id: number;
  name: string;
  opeid8: string;
  state: string;
  country: string;
  address: string;
  zipCode: string;
};

type ISchoolDetails = ISchool & {
  loanTypes: ILoanType;
  costOfAttendance: {
    inState: number;
    outOfState: number;
  };
};
export interface IAccreditedSchoolServiceClient {
  getSchools(
    search: { opeid8?: string; name?: string; loanType?: ILoanType },
    context: ChassisPluginContext,
  ): Promise<Array<ISchool>>;
}
declare module "@earnest-labs/microservice-chassis/PluginContext.js" {
  interface LoadedPlugins {
    accreditedSchoolServiceClient: AccreditedSchoolServicePlugin;
  }
}
declare module "clients/accredited-school-service/index.js" {
  type AccreditedSchoolServiceClient = IAccreditedSchoolServiceClient;

  type LoanType = ILoanType;

  type School = ISchool;

  type SchoolDetails = ISchool & {
    loanTypes: LoanType;
    costOfAttendance: {
      inState: number;
      outOfState: number;
    };
  };
}
