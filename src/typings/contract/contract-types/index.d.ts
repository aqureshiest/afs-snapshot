import type { Input as IContractInput } from "contract/manifest.js";
import type { PluginContext as ChassisPluginContext } from "@earnest-labs/microservice-chassis/PluginContext.js";
import {
  Application,
  Event,
  EventName,
  ApplicationSearchCriteria,
  Scalars,
} from "@earnest/application-service-client/typings/codegen.js";
import IContract, {
  Injections as IExecutionInjections,
} from "contract/contract.js";
import type { ApplicationState, UserState } from "clients/redis/index.js";

interface IContractArguments<D> {
  id: string;
  definition: D;
  input: IContractInput;
  context: ChassisPluginContext;
}
interface IError {
  error: string;
  contractType: string;
}
import "contract/contract-types/base-contract.js";
declare module "contract/contract-types/base-contract.js" {
  /**
   * ContractType constructor
   */
  interface ConstructorArguments {
    id: string;
    contract: IContract;
  }

  type Injections = IExecutionInjections;

  type ContractArguments<D> = IContractArguments<D>;
  type Context = ChassisPluginContext;
}

import "contract/contract-types/noop.js";
declare module "contract/contract-types/noop.js" {
  type Input = IContractInput;
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
    [key: string]: unknown;
  };

  type Injections = IExecutionInjections;

  type MinimalApplication = {
    id: string;
  };

  type MutationSchema = IMutationSchema;

  type Output = { [key: string]: Event };
}
import "contract/contract-types/plaid-method.js";
declare module "contract/contract-types/plaid-method.js" {
  type Input = IContractInput;
  type Context = ChassisPluginContext;
  type Definition = {
    plaidMethod:
      | "searchInstitutions"
      | "createLinkToken"
      | "exchangePublicToken"
      | "getAccounts"
      | "exchangePublicTokenAndGetAccounts";
    id: string;
    payload?: { public_token: string };
    [key: string]: unknown;
  };

  type Injections = IExecutionInjections;

  type MinimalApplication = {
    id: string;
  };

  type Output = { [key: string]: unknown };
}

import "contract/contract-types/syllabus-section.js";
declare module "contract/contract-types/syllabus-section.js" {
  type Context = ChassisPluginContext;
  type ProgressStats = {
    totalQuestions: number;
    completedQuestions: number;
  };
  type Definition = {
    status: string;
    statuses: string[];
    mode: "section" | "stats";
    progress: ProgressStats;
    [key: string]: unknown;
  };
  type Transformation = {
    progress: ProgressStats;
    [key: string]: unknown;
  };

  type Injections = IExecutionInjections;

  type MinimalApplication = {
    id: string;
  };
}

import "contract/contract-types/application-data.js";
declare module "contract/contract-types/application-data.js" {
  type Input = IContractInput;
  type Context = ChassisPluginContext;

  type LookupDefinition =
    | { id: string }
    | {
        criteria: ApplicationSearchCriteria[];
        limit?: Scalars["Int"]["input"];
        page?: Scalars["Int"]["input"];
      };

  type Definition = LookupDefinition;

  type Injections = IExecutionInjections;

  type MinimalApplication = {
    id: string;
  };

  type Output = Application | Application[];
}

import "contract/contract-types/analytics.js";
declare module "contract/contract-types/analytics.js" {
  type Input = IContractInput;
  type Context = ChassisPluginContext;
  type Definition = {
    event: string;
    type: string;
    payload: { [key: string]: string };
  };

  type Injections = IExecutionInjections;

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
      | "getDecision";
    id: string;
    payload: IWebhookEventPayload;
  };
  type Injections = IExecutionInjections;

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

  type Injections = IExecutionInjections;

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
  type Injections = IExecutionInjections;

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
  type Injections = IExecutionInjections;

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
    error: string | string[];
  };
  type Injections = IExecutionInjections;
  type Output = { [key: string]: unknown };
}
