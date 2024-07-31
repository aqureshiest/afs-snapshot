import type { Plugin as ChassisPlugin } from "@earnest-labs/microservice-chassis/Plugin.js";
import type {
  AccountAssets as IAccountAssets,
  AssetReportCreateResponse,
  CreditRelayCreateResponse,
  Item,
  ItemPublicTokenExchangeResponse,
  Institution as IInstitution,
} from "plaid";
import PlaidClient from "clients/plaid/index.js";
import { Input as IContractInput } from "contract/manifest.js";
import { ExecutionContext as IExecutionContext } from "contract/executable.js";
import type { HttpError as IHttpError } from "http-errors";

type PlaidChassisPlugn = ChassisPlugin<PlaidClient>;

import type { Application as IApplication } from "@earnest/application-service-client/typings/codegen.js";

import type { PluginContext } from "@earnest-labs/microservice-chassis/PluginContext.js";
declare module "@earnest-labs/microservice-chassis/PluginContext.js" {
  interface LoadedPlugins {
    plaid: PlaidChassisPlugn;
  }
}

declare module "clients/plaid/index.js" {
  interface PlaidMethod<U = unknown, O = unknown> {
    (
      this: PlaidClient,
      context: PluginContext,
      application: IApplication,
      id: string,
      payload: U & { public_token?: string },
    ): Promise<{ errors: Array<Error | IHttpError>; results?: O }>;
  }

  // cloned from Plaid SDK
  type PlaidLinkToken = {
    /**
     * A `link_token`, which can be supplied to Link in order to initialize it and receive a `public_token`, which can be exchanged for an `access_token`.
     * @type {string}
     * @memberof PlaidLinkToken
     */
    link_token: string;
    /**
     * The expiration date for the `link_token`, in [ISO 8601](https://wikipedia.org/wiki/ISO_8601) format. A `link_token` created to generate a `public_token` that will be exchanged for a new `access_token` expires after 4 hours. A `link_token` created for an existing Item (such as when updating an existing `access_token` by launching Link in update mode) expires after 30 minutes.
     * @type {string}
     * @memberof PlaidLinkToken
     */
    expiration: string;
    /**
     * A unique identifier for the request, which can be used for troubleshooting. This identifier, like all Plaid identifiers, is case sensitive.
     * @type {string}
     * @memberof PlaidLinkToken
     */
    request_id: string;
    /**
     * A URL of a Plaid-hosted Link flow that will use the Link token returned by this request. Only present if the client is enabled for Hosted Link (beta).
     * @type {string}
     * @memberof PlaidLinkToken
     */
    hosted_link_url?: string;
  };
  type PlaidGetAccounts = {
    accounts: Array<IAccountAssets>;
    item: Item;
  };
  type PlaidAccessTokenResponse = ItemPublicTokenExchangeResponse;
  type Institutions = Array<IInstitution>;
  type PlaidAssetReport = AssetReportCreateResponse;
  type PlaidRelayToken = CreditRelayCreateResponse;
  type Institution = IInstitution;
  type InstitutionsResponse = { institutions: Institutions };
  type Input<I> = IContractInput<I>;
  type Application = IApplication;
}

declare module "clients/plaid/plaid.test.js" {
  type ExecutionContext = IExecutionContext<unknown>;
  type Application = IApplication;
}
