import { Client } from "@earnest/http";
import PluginContext from "@earnest-labs/microservice-chassis/PluginContext.js";
import SensitiveString from "@earnest-labs/ts-sensitivestring";
const gql = String.raw;
export default class PlaidClient extends Client {
  clientID
  secret
  constructor(context: PluginContext, client_id: string, secret: string, baseUrl: string) {
    const options = { baseUrl };
    super(options);
    this.clientID = client_id
    this.secret = secret
  }
  get auth() {
    return {
      client_id: this.clientID,
      secret: this.secret
    }
  }
  get headers() {
    return {
      ...super.headers,
      "Content-Type": "application/json",
      Accept: "application/json",
      "Plaid-Version": "2020-09-14",
    };
  }
  

  async createLinkToken(context: PluginContext, id: string, payload) {
    const ApplyBaseUrl =
      SensitiveString.ExtractValue(
        context.env.BASE_URL,
      ) || "";
    const request = {
      user: {
        // TODO: get userId from reference cognitoID 
        client_user_id: payload.cognitoID,
      },
      client_name: "Earnest", // TODO: based on application brand?
      products: ["assets"],
      webhook: `${ApplyBaseUrl}/plaid/webhook/${id}`,
      country_codes: ["US"],
      language: "en",
      ...this.auth
    };
    const {results, response} = await this.post<PlaidLinkToken>({
      uri: '/link/token/create',
      body: request,
      headers: this.headers
    });
    return results.link_token;
  }
  async getAccounts(context: PluginContext, id: string, payload) {
    const request = {
      ...this.auth,
      access_token: payload.access_token
    }
    const {results, response} = await this.post<PlaidGetAccounts>({
      uri: "accounts/get",
      body: request,
      headers: this.headers
    })
    if (response.statusCode !== 200) {
      context.logger.error(`[231c4ea1] PLAID - failed to get accounts, status code: ${response.statusCode}, ${response.statusMessage}`)
    } else {
      return results;
    }
  }

  //exchanges a public token for a acces_token/itemId
  async exchangePublicToken(context: PluginContext, id: string, payload) {
    const request = {
      public_token: payload.public_token,
      ...this.auth
    };
    const {results, response} = await this.post<PlaidAccessTokenResponse>({
      uri: '/item/public_token/exchange',
      body: request,
      headers: this.headers
    });
    if (response.statusCode !== 200) {
      context.logger.error(`[7459548f] PLAID - failed to exchange token, status code: ${response.statusCode}, ${response.statusMessage}`)
    } else {
      return results;
    }
    
  }
  async exchangePublicTokenAndGetAccounts(context: PluginContext, id: string, payload) {
    const applicationService = context.loadedPlugins.applicationServiceClient.instance;
    console.log('======= aqui')
    context.logger.silly(`Plaid exchange Public Token requested.`)
    const accessToken = await this.exchangePublicToken(context, id, payload);
    if (accessToken) {
      const plaidResponse = await this.getAccounts(context, id, accessToken.access_token)
      console.log("plaid Response", plaidResponse)
      if (plaidResponse) {
        const financialAccounts = plaidResponse.accounts?.map(faccount => {
          return {
            name: faccount.official_name,
            type: faccount.type,
            account_last4: faccount.mask,
            institution_id: plaidResponse.item.institution_id,
            balance: faccount.balances.current,
            plaidItemID: plaidResponse.item.item_id,
            plaidAccessToken: accessToken.access_token
          }
        })
        console.log('financial Accounts', financialAccounts)
        const ASresponse = await applicationService?.sendRequest({
          query: gql`mutation($id: UUID!, $details: AddDetailInput, $meta: EventMeta) {
            addDetails(
              id: $id,
              details: $details,
              meta: $meta
            ) {
              id
            }
          }`,
          variables: {
            id,
            details: {
              financialAccounts
            },
            meta: { service: "apply-flow-service" }
          }
        })
        console.log('application service response', ASresponse)
        return ASresponse;
      }
    }
    
    
    
  }
  
}
