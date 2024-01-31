import type { Plugin as ChassisPlugin } from "@earnest-labs/microservice-chassis/Plugin.js";
import AccreditedSchoolServiceClient from "clients/accredited-school-service/index.js";
type AccreditedSchoolServicePlugin =
  ChassisPlugin<AccreditedSchoolServiceClient>;

declare module "@earnest-labs/microservice-chassis/PluginContext.js" {
  interface LoadedPlugins {
    accreditedSchoolServiceClient: AccreditedSchoolServicePlugin;
  }
}
declare module "clients/accredited-school-service/index.js" {
  type LoanType = "slo" | "slr";

  type School = {
    id: number;
    name: string;
    opeid8: string;
    state: string;
    country: string;
    address: string;
    zipCode: string;
  };

  type SchoolDetails = School & {
    loanTypes: LoanType;
    costOfAttendance: {
      inState: number;
      outOfState: number;
    };
  };
}
