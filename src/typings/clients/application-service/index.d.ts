import type { Plugin as ChassisPlugin } from "@earnest-labs/microservice-chassis/Plugin.js";
import type { PluginContext as ChassisPluginContext } from "@earnest-labs/microservice-chassis/PluginContext.js";
import type { IncomingMessage } from "http";
import ApplicationServiceClient from "../../../clients/application-service/index.js"

import "../../../clients/application-service/chassis-plugin.js";
declare module "../../clients/application-service/chassis-plugin.ts" {
  type Plugin = ChassisPlugin
  type Context = ChassisPluginContext;
  type instance = ApplicationServiceClient;
}

interface IRequestTokenResponse {
  results: {
    token: string;
  },
  response: IncomingMessage;
}

interface IApplicationFragment {
  id?: string;
  createdAt?: string;
  deleltedAt?: string;
}

interface IApplication {
  id?: string;
  createdAt?: string;
  deletedAt?: string;
  root: IApplicationFragment
  applicants: Array<IApplicationFragment>
  beneficiary: IApplicationFragment
  benefactor: IApplicationFragment
  primary: IApplicationFragment
  cosigner: IApplicationFragment
  serialization: IApplicationFragment
  serialization_of: IApplicationFragment
  tags?: Array<{
    createdAt?: string;
    deletedAt?: string;
    eventId?: string;
    tag?: string;
  }>;
  amount?: {
    requested?: number
    certified?: number
    approved?: number
  };
  dateOfBirth?: string;
  education?: Array<{
    degree?: string;
    enrollment?: string;
    graduationDate?: string;
    termStart?: string;
    termEnd?: string;
    credits?: number;
  }>;
  email?: string; 
  income?: Array<{
    amount?: number
    type?: string;
    employer?: string;
    name?: string;
    title?: string;
    start?: string;
    end?: string;
  }>;
  location?: {
    street1?: string;
    street2?: string;
    city?: string;
    state?: string;
    zip?: number;
    citizenship?: string;
  };
  name?: {
    first?: string;
    last?: string;
    middle?: string;
    title?: string;
  };
  phone: Array<{
    type?: string;
    number?: string;
  }>;
  cognitoId?: string;
  monolithUserId?: string;
  product?: string; 
}

interface IQueryResponse {
  results: {
    data: {
      application: IApplication
    }
  },
  response: IncomingMessage
}

interface IMutationSchema {
  __type: {
    name: string,
    fields: Array<{
      name: string,
      args: Array<{
        name: string,
        type: {
          name: string,
          kind: string,
          ofType?: {
            name: string
          }
        }
      }>
    }>
  }
}

interface ISchemaResponse {
  results: {
    data: IMutationSchema 
  }
  response: IncomingMessage
}

interface IMutationResponse {
  results: {
    data: {
      [key: string]: unknown
    }
  },
  response: IncomingMessage
}

declare module "../../../clients/application-service/index.js" {
  type RequestTokenResponse = IRequestTokenResponse;
  type Application = IApplication;
  type QueryResponse = IQueryResponse;
  type SchemaReponse = ISchemaResponse; 
  type Schema = IMutationSchema;
  type Mutation = IMutationResponse;
}