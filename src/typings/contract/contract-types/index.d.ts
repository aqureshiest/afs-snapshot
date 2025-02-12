import type { Input as IContractInput } from "contract/manifest.js";
import type { PluginContext as ChassisPluginContext } from "@earnest-labs/microservice-chassis/PluginContext.js";
import {
  Application,
  Event,
  EventName,
  ApplicationSearchCriteria,
  Scalars,
} from "@earnest/application-service-client/typings/codegen.js";
import type { Client } from "@earnest/http";

import IContract from "contract/contract.js";
import type { ApplicationState, UserState } from "clients/redis/index.js";
import type { Claims as NeasClaims } from "clients/NEAS/index.js";
import type { ExecutionContext as IExecutionContext } from "contract/executable.js";

interface IContractArguments<D, I> {
  id: string;
  definition: D;
  input: IContractInput;
  context: ChassisPluginContext;
}
interface IError {
  error: string;
  contractType: string;
}

import "contract/contract-executable.js";
declare module "contract/contract-executable.js" {
  type Context = ChassisPluginContext;
  type Contract<I> = IContract;
}

import "contract/contract-types/noop.js";
declare module "contract/contract-types/noop.js" {
  type Input<I> = IContractInput;
  type Context = ChassisPluginContext;
  type Definition = boolean;

  type Output = {
    [key: string]: {
      [key: string]: {
        [key: string]: unknown;
      };
    };
  };
}

interface IMutationSchema {
  __type: {
    name: string;
    fields: Array<{
      name: string;
      args: Array<{
        name: string;
        type: {
          name: string;
          kind: string;
          ofType?: {
            name: string;
          };
        };
      }>;
    }>;
  };
}

import "contract/contract-types/application-event.js";
declare module "contract/contract-types/application-event.js" {
  type Input = IContractInput;
  type Context = ChassisPluginContext;
  type Definition = {
    event: EventName;
    id?: string;
    fields: string;
    payload: { [key: string]: unknown };
    application: never;
    rehydrate?: boolean;
    [key: string]: unknown;
  };

  type MinimalApplication = {
    id: string;
  };

  type MutationSchema = IMutationSchema;

  type Output = { event: string } & Partial<Event>;
}

import type {
  default as PlaidClient,
  PlaidMethod,
} from "clients/plaid/index.js";
import "contract/contract-types/plaid-method.js";
declare module "contract/contract-types/plaid-method.js" {
  type Input = IContractInput;
  type Context = ChassisPluginContext;
  interface Definition {
    plaidMethod:
      | "searchInstitutions"
      | "createLinkToken"
      | "exchangePublicToken"
      | "getAccounts"
      | "exchangePublicTokenAndGetAccounts";
    id: string;
    payload?: Parameters<PlaidClient[this["plaidMethod"]]>[3];
    [key: string]: unknown;
  }

  type IPlaidMethod = PlaidMethod;

  type MinimalApplication = {
    id: string;
  };

  type Output = { [key: string]: unknown } | Array<Output> | undefined;
}

import "contract/contract-types/application-data.js";
declare module "contract/contract-types/application-data.js" {
  type Input = IContractInput;
  type Context = ChassisPluginContext;

  type LookupDefinition =
    | { id: string; required: boolean }
    | {
        criteria: ApplicationSearchCriteria[];
        limit?: Scalars["Int"]["input"];
        page?: Scalars["Int"]["input"];
      };

  type Definition = LookupDefinition;

  type MinimalApplication = {
    id: string;
  };

  type Output = Application | Application[];
}

import "contract/contract-types/analytics.js";
declare module "contract/contract-types/analytics.js" {
  type Input = IContractInput;
  type Context = ChassisPluginContext;
  type map = { [key: string]: string } & { [key: string]: Array<string> };
  type Definition = {
    event: string;
    type: string;
    anonymousId: string;
    userId?: string;
    payload: { serverProperties: map } & map;
  };
  type Cookies = {
    ajs_anonymous_id: string;
    device_id: string;
  };

  type Output = { [key: string]: string | boolean } | null;
}

import "contract/contract-types/decision-request.js";
import { IWebhookEventPayload } from "../../clients/lending-decision-service/index.js";
declare module "contract/contract-types/decision-request.js" {
  type Input = IContractInput;
  type Context = ChassisPluginContext;
  type Definition = {
    decisionRequestMethod:
      | "postDecisionRequest"
      | "saveDecision"
      | "getDecision"
      | "rateCheckRequest"
      | "getArtifacts"
      | "getPaymentsAndRates";
    id: string;
    payload: IWebhookEventPayload;
  };
  type MinimalApplication = {
    id: string;
  };
  type Output = { [key: string]: unknown };
}

import "contract/contract-types/redis-method.js";
declare module "contract/contract-types/redis-method.js" {
  type Input = IContractInput;
  type Context = ChassisPluginContext;
  type Definition = {
    redisMethod:
      | "getApplicationState"
      | "setApplicationState"
      | "getUserState"
      | "setUserState";
    key: string;
    value?: ApplicationState | UserState;
  };

  type MinimalApplication = {
    id: string;
  };
  type Output = { [key: string]: unknown };
}

import "contract/contract-types/pii-request.js";
declare module "contract/contract-types/pii-request.js" {
  type Input = IContractInput;
  type Context = ChassisPluginContext;
  type Definition = {
    piiRequestMethod: "saveToken" | "getTokenValue";
    id: string;
    value: string;
  };

  type MinimalApplication = {
    id: string;
  };
  type Output = { [key: string]: unknown };
}

import "contract/contract-types/accredited-school-service-request.js";
declare module "contract/contract-types/accredited-school-service-request.js" {
  type Input = IContractInput;
  type Context = ChassisPluginContext;
  type Definition = {
    accreditedSchoolServiceRequestMethod: "getSchools";
    id?: string;
    search: { opeid?: string; name?: string };
  };

  type MinimalApplication = {
    id: string;
  };
  type Output = { [key: string]: unknown };
}

import "contract/contract-types/neas-request.js";
declare module "contract/contract-types/neas-request.js" {
  type Input = IContractInput;
  type Context = ChassisPluginContext;
  type Definition = {
    neasMethod:
      | "createAccountlessUser"
      | "createAccountlessSession"
      | "sendVerificationEmail";
  };

  type MinimalApplication = {
    id: string;
  };
  type Output = { [key: string]: unknown };
}

import "contract/contract-types/error.js";
declare module "contract/contract-types/error.js" {
  type Input = IContractInput;
  type Context = ChassisPluginContext;
  type Definition = {
    statusCode?: number;
    error: string | string[];
  };
  type Output = { [key: string]: unknown };
}

import "contract/contract-types/cis-person-method.js";
declare module "contract/contract-types/cis-person-method.js" {
  type Input = IContractInput;
  type Context = ChassisPluginContext;
  type Definition = {
    cisPersonMethod: "getCisPersonLoans";
    id: string;
    value: string;
  };

  type MinimalApplication = {
    id: string;
  };

  type CisPersonLoanOutput = { [key: string]: unknown };
  type Output = Array<CisPersonLoanOutput>;
}

import "contract/contract-types/optimizely-method.js";
declare module "contract/contract-types/optimizely-method.js" {
  type Input = IContractInput;
  type Context = ChassisPluginContext;
  type Definition = {
    optimizelyMethod: "getFeatureFlags";
    userId: string;
    featureFlagKeys: { [key: string]: Array<string> };
    attributes?: { [key: string]: unknown };
  };
  type MinimalApplication = {
    id: string;
  };
  type Output = { [key: string]: boolean };
}
