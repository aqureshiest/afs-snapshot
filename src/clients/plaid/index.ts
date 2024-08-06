import PluginContext from "@earnest-labs/microservice-chassis/PluginContext.js";
import { Event } from "@earnest/application-service-client/typings/codegen.js";
import { Institution } from "plaid";
import SensitiveString from "@earnest-labs/ts-sensitivestring";
const gql = String.raw;

import Client from "../client.js";

export default class PlaidClient extends Client {
  clientID;
  secret;

  constructor(
    context: PluginContext,
    client_id: string,
    secret: string,
    baseUrl: string,
  ) {
    const options = { baseUrl };
    super(options);
    this.clientID = client_id;
    this.secret = secret;

    const defaultHeaders = this.headers;

    Object.defineProperty(this, "headers", {
      get() {
        return {
          ...defaultHeaders,
          "Plaid-Version": "2020-09-14",
        };
      },
    });
  }

  get auth() {
    return {
      client_id: this.clientID,
      secret: this.secret,
    };
  }

  /* eslint-disable-next-line @typescript-eslint/no-unused-vars */
  createLinkToken: PlaidMethod<{ userId: string }> = async function (
    context,
    application,
    id,
    payload,
  ) {
    const errors: Error[] = [];
    const request = {
      user: {
        // TODO: get userId from reference cognitoID
        client_user_id: payload.userId,
      },
      client_name: "Earnest", // TODO: based on application brand?
      products: ["assets"],
      webhook: `${this.baseUrl}/webhooks/plaid/${id}`,
      country_codes: ["US"],
      language: "en",
      account_filters: {
        depository: {
          account_subtypes: ["checking", "savings"],
        },
      },
      ...this.auth,
    };

    const { results, response } = await this.post<PlaidLinkToken>(
      {
        uri: "/link/token/create",
        body: request,
        headers: this.headers,
      },
      context,
    );

    if (response.statusCode !== 200 || !results.link_token) {
      const error = new Error("failed-link-token-creation");
      this.log(
        {
          error,
          results,
        },
        context,
      );
      errors.push(error);
      throw error;
    }

    return { results: results.link_token, errors };
  };

  getAccounts: PlaidMethod<{ access_token: string }, PlaidGetAccounts> =
    async function (context: PluginContext, application, id: string, payload) {
      const errors: Error[] = [];
      const request = {
        ...this.auth,
        access_token: payload.access_token,
      };

      const { results, response } = await this.post<PlaidGetAccounts>(
        {
          uri: "accounts/get",
          body: request,
          headers: this.headers,
        },
        context,
      );

      if (response.statusCode !== 200) {
        const error = new Error("get-account-failure");

        errors.push(error);

        this.log(
          {
            message: response.statusMessage,
            results,
          },
          context,
        );

        return { errors };
      } else {
        return { results, errors };
      }
    };

  searchInstitutions: PlaidMethod<
    { query: string },
    Array<
      Pick<
        InstitutionsResponse["institutions"][number],
        "institution_id" | "name"
      >
    >
  > = async function (context, application, id, payload) {
    const errors: Error[] = [];

    if (!payload.query) {
      throw new Error(`[49f71236] PLAID - query param is required.`);
    }
    const request = {
      query: payload.query,
      products: ["transactions"],
      country_codes: ["US"],
      ...this.auth,
    };
    const { results, response } = await this.post<InstitutionsResponse>(
      {
        uri: "/institutions/search",
        body: request,
        headers: this.headers,
      },
      context,
    );

    if (response.statusCode !== 200 || !results.institutions) {
      const error = new Error(
        `[cc591259] PLAID - failed to search institutions - ${response.statusCode}, ${response.statusMessage}`,
      );

      errors.push(error);

      this.log(
        {
          error,
          results,
        },
        context,
      );
      throw error;
    }

    const filteredInstitutions = results.institutions.map((bank) => ({
      institution_id: bank.institution_id,
      name: bank.name,
    }));

    return { results: filteredInstitutions, errors };
  };

  async getInstitution(
    context: PluginContext,
    application,
    id: string,
    payload,
  ) {
    const request = {
      institution_id: payload.institution_id,
      country_codes: ["US"],
      ...this.auth,
    };
    const { results, response } = await this.post<{
      institution: Institution;
      request_id: string;
    }>(
      {
        uri: "/institutions/get_by_id",
        body: request,
        headers: this.headers,
      },
      context,
    );

    if (response.statusCode !== 200 || !results) {
      const error = new Error(
        `[9279bcc6] PLAID - failed to get institution - ${response.statusCode}, ${response.statusMessage}`,
      );
      this.log(
        {
          error,
          results,
        },
        context,
      );
      throw error;
    }

    return results.institution;
  }

  // requests ASSETS REPORT for a given array of access_token
  async createAssetsReport(
    context: PluginContext,
    application,
    id: string,
    payload,
  ) {
    const PLAID_ASSETS_REPORT_DAYS_REQUESTED =
      context.env.PLAID_ASSETS_REPORT_DAYS_REQUESTED || 60;
    const request = {
      access_tokens: payload.access_tokens,
      days_requested: Number(PLAID_ASSETS_REPORT_DAYS_REQUESTED),
      options: {
        // webhook: `${this.baseUrl}/webhooks/plaid/${id}`,
      },
      ...this.auth,
    };
    const { results, response } = await this.post<PlaidAssetReport>(
      {
        uri: "/asset_report/create",
        body: request,
        headers: this.headers,
      },
      context,
    );

    if (response.statusCode !== 200) {
      const error = new Error(
        `[eabdd551] PLAID - failed to get asset report - ${response.statusCode}, ${response.statusMessage}`,
      );
      this.log(
        {
          error,
          results,
        },
        context,
      );
      throw error;
    }
    return results.asset_report_token;
  }
  // creates a plaid relay token
  async createRelayToken(
    context: PluginContext,
    application,
    id: string,
    payload,
  ) {
    const ReportToken = await this.createAssetsReport(
      context,
      application,
      id,
      payload,
    );
    const { results, response } = await this.post<PlaidRelayToken>(
      {
        uri: "/credit/relay/create",
        body: {
          report_tokens: [ReportToken],
          secondary_client_id: SensitiveString.ExtractValue(
            context.env.PLAID_LDS_CLIENT_ID,
          ),
          ...this.auth,
        },
        headers: this.headers,
      },
      context,
    );

    if (response.statusCode !== 200) {
      const error = new Error(
        `[038ed001] PLAID - failed to create a Relay Token - ${response.statusCode}, ${response.statusMessage}`,
      );
      this.log(
        {
          error,
          results,
        },
        context,
      );
      throw error;
    }
    return results.relay_token;
  }

  //exchanges a public token for a acces_token/itemId
  exchangePublicToken: PlaidMethod<unknown, PlaidAccessTokenResponse> =
    async function (context, application, id, payload) {
      const errors: Error[] = [];
      const request = {
        public_token: payload.public_token,
        ...this.auth,
      };
      const { results, response } = await this.post<PlaidAccessTokenResponse>(
        {
          uri: "/item/public_token/exchange",
          body: request,
          headers: this.headers,
        },
        context,
      );

      if (response.statusCode !== 200) {
        const error = new Error(
          `[7459548f] PLAID - failed to exchange token, status code: ${response.statusCode}, ${response.statusMessage}`,
        );

        this.log(
          {
            error,
            results,
          },
          context,
        );

        errors.push(error);

        return { errors };
        throw error;
      }

      return { results, errors };
    };

  /**
   * TODO: holy hell, this plaid client method is a hot mess
   */
  exchangePublicTokenAndGetAccounts: PlaidMethod = async function (
    context: PluginContext,
    application,
    id: string,
    payload,
  ) {
    const errors: Error[] = [];

    const applicationService =
      context.loadedPlugins.applicationServiceClient?.instance;

    context.logger.silly(`Plaid exchange Public Token requested.`);
    const { results: accessToken, errors: publicTokenErrors } =
      await this.exchangePublicToken(context, application, id, payload);

    errors.push(...publicTokenErrors);

    const applicant = application?.applicants?.find((app) => app?.id === id);

    if (accessToken) {
      const { results: plaidResponse, errors: getAccountsErrors } =
        await this.getAccounts(context, application, id, accessToken);

      errors.push(...getAccountsErrors);

      if (plaidResponse) {
        const institution = await this.getInstitution(
          context,
          application,
          id,
          {
            institution_id: plaidResponse.item.institution_id,
          },
        );
        const plaidAccountIDsAdded: Array<string> = [];
        const financialAccounts = plaidResponse.accounts
          ?.map((faccount) => {
            if (
              !["depository"].includes(faccount.type) ||
              !["checking", "savings"].includes(String(faccount.subtype))
            ) {
              errors.push(new Error("loan-accounts-error"));
            } else {
              const balanceInCents =
                Math.round(Number(faccount.balances.current || 0)) * 100;
              // this was first though as using the plaid Account ID as to check if the account already exists,
              //  but plaid returns a new account ID every time the public token is exchanged.
              // instead we are using a combination of the institution name, account type, account number and balance to check if the account already exists
              const existingAccount =
                applicant?.details?.financialAccounts?.find(
                  (account) =>
                    account?.name === institution.name &&
                    account?.type === faccount.subtype &&
                    // padding the account last 4, since plaid response seems to allow in some cases a mask of 3 digits
                    account?.account_last4 ===
                      faccount.mask?.toString().padStart(4, "-") &&
                    Math.round(Number(account?.balance)) === balanceInCents,
                );
              if (!existingAccount) {
                plaidAccountIDsAdded.push(faccount.account_id);

                return {
                  name: institution.name,
                  type: faccount.subtype,
                  selected: true,
                  // padding the account last 4, since plaid response seems to allow in some cases a mask of 3 digits
                  account_last4: faccount.mask?.toString().padStart(4, "-"),
                  balance: balanceInCents,
                  plaidAccountID: faccount.account_id,
                  plaidItemID: plaidResponse.item.item_id,
                  plaidAccessToken: accessToken.access_token,
                };
              } else {
                errors.push(new Error("duplicated-account-error"));
              }
            }
          })
          .filter((account) => account);

        if (financialAccounts.length > 0) {
          try {
            const ASresponse = (await applicationService?.sendRequest(
              {
                query: gql`
                  mutation (
                    $id: UUID!
                    $details: AddDetailInput
                    $meta: EventMeta
                  ) {
                    addDetails(id: $id, details: $details, meta: $meta) {
                      id
                      error
                      application {
                        details {
                          financialAccounts {
                            index
                            name
                            type
                            selected
                            plaidAccountID
                            account_last4
                            balance
                          }
                        }
                      }
                    }
                  }
                `,
                variables: {
                  id,
                  details: {
                    financialAccounts,
                  },
                  meta: { service: "apply-flow-service" },
                },
              },
              context,
            )) as unknown as { addDetails: Event };

            if (ASresponse.addDetails.error) {
              errors.push(
                new Error("application-service-error"),
                new Error(ASresponse.addDetails.error),
              );
            }

            if (ASresponse.addDetails.application.details) {
              const { financialAccounts: resultAccounts } =
                ASresponse.addDetails.application.details;

              const result = resultAccounts?.filter((graphqlAccount) => {
                if (graphqlAccount?.plaidAccountID)
                  return plaidAccountIDsAdded.includes(
                    graphqlAccount?.plaidAccountID,
                  );
              });

              const results = result?.map((account) => {
                return {
                  index: account?.index,
                  name: account?.name,
                  type: account?.type,
                  selected: account?.selected,
                  account_last4: account?.account_last4,
                  balance:
                    account && account.balance && account.balance > 0
                      ? account.balance / 100
                      : 0,
                };
              });

              return { errors, results };
            } else {
              return { errors, results: [] };
            }
          } catch (ex) {
            this.log(
              {
                error: ex,
              },
              context,
            );

            errors.push(ex);

            return { errors, results: [] };
          }
        }
      }
    }
    return { errors, results: [] };
  };
}
