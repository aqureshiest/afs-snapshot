import PluginContext from "@earnest-labs/microservice-chassis/PluginContext.js";
import Client from "../client.js";

export default class PiiTokenServiceClient extends Client {
  get clientName() {
    return "PiiTokenService";
  }
  private accessKey: string;
  constructor(accessKey: string, baseUrl: string) {
    const options = { baseUrl };

    super(options);
    this.accessKey = accessKey;
  }

  /**
   * Given the encrypted URI token, Get the decrypted SSN from PII-Token-Service
   * @param token string
   * @return {Promise<string>}
   */
  async getTokenValue(context: PluginContext, token: string): Promise<string> {
    if (!token) {
      throw new Error("[9cfa7507] Token is required.");
    }
    const encodedURI = encodeURIComponent(token);
    const { results, response } = await this.get<{ value: string }>(
      {
        uri: "/tokens?uri=" + encodedURI,
        headers: {
          ...this.headers,
          Authorization: `Bearer ${this.accessKey}`,
        },
        resiliency: {
          attempts: 3,
          delay: 100,
          timeout: 100000,
        },
      },
      context,
    );

    if (response.statusCode == null || response.statusCode >= 400) {
      const error = new Error(
        `[6d12a0cf] getTokenValue failed with response code: ${response.statusCode}`,
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

    return results ? results.value : "";
  }

  /**
   * Given the SSN value, make a post request to token service to encrypt and get the URI
   * @param value string
   * @return {Promise<string>}
   */
  async saveToken(context: PluginContext, value: string): Promise<string> {
    if (!value) {
      throw new Error("[7adfc728] Value is required.");
    }

    const { results, response } = await this.post<{ uri: string }>(
      {
        uri: "/tokens",
        body: { value },
      },
      context,
    );

    if (response.statusCode == null || response.statusCode >= 400) {
      const error = new Error(
        `[ec3424f2] saveToken failed with response code: ${response.statusCode}`,
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

    return results.uri;
  }
}
