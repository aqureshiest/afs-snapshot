import type { Plugin as ChassisPlugin } from "@earnest-labs/microservice-chassis/Plugin.js";
import type { PluginContext as ChassisPluginContext } from "@earnest-labs/microservice-chassis/PluginContext.js";

import CisPersonClient from "clients/cis-person/client.js";
type CisPersonClientPlugin = ChassisPlugin<CisPersonClient>;

declare module "@earnest-labs/microservice-chassis/PluginContext.js" {
  interface LoadedPlugins {
    cisPersonClient: CisPersonClientPlugin;
  }
}

declare module "clients/cis-person/chassis-plugin.js" {
  type Context = ChassisPluginContext;
  type Plugin = CisPersonClientPlugin;
}

declare module "clients/cis-person/client.js" {
  type Loan = {
    loanKey?: {
      id?: string;
    };
    loanProgramCode?: string;
    loanStatusCode?: string;
    [key: string]: unknown;
  };
  type Role = {
    loans?: {
      loan?: Array<Loan> | Loan
    }
    [key: string]: unknown;
  };
  type CisPerson = {
    role?: Array<Role>;
    [key: string]: unknown;
  };
  type InfoLoan = {
    loanId?: string;
    loanProgramCode?: string;
    loanStatusCode?: string;
  };
  type CisInfoLoan = Array<InfoLoan>;
}
