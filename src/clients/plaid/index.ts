import { Client } from "@earnest/http";
import PluginContext from "@earnest-labs/microservice-chassis/PluginContext.js";
import SensitiveString from "@earnest-labs/ts-sensitivestring";

export default class PlaidClient extends Client {
  clientID
  secret
  constructor(context: PluginContext, client_id: string, secret: string, baseUrl: string) {
    const options = { baseUrl };
    super(options);
    this.clientID = client_id
    this.secret = secret
  }
  get headers() {
    return {
      ...super.headers,
      "Content-Type": "application/json",
      Accept: "application/json",
      "Plaid-Version": "2020-09-14",
      "client_id": this.clientID,
      "secret": this.secret
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
    };
    const {results, response} = await this.post<PlaidLinkToken>({
      uri: '/link/token/create',
      body: request,
      headers: this.headers
    });
    return results.link_token;
  }
}
