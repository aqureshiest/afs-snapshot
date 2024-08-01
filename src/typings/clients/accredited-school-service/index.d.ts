import type { Plugin as ChassisPlugin } from "@earnest-labs/microservice-chassis/Plugin.js";
import AccreditedSchoolServiceClient from "clients/accredited-school-service/index.js";
import { Input as IContractInput } from "contract/manifest.js";

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
declare module "@earnest-labs/microservice-chassis/PluginContext.js" {
  interface LoadedPlugins {
    accreditedSchoolServiceClient: AccreditedSchoolServicePlugin;
  }
}
declare module "clients/accredited-school-service/index.js" {
  type LoanType = ILoanType;

  type School = ISchool;
  type Input = IContractInput;
  type SchoolDetails = ISchool & {
    loanTypes: LoanType;
    costOfAttendance: {
      inState: number;
      outOfState: number;
    };
  };
}
