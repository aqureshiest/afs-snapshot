import { Client } from "@earnest/http";
import PluginContext from "@earnest-labs/microservice-chassis/PluginContext.js";
import { HttpRequest } from "@earnest/http";
export default class PiiTokenServiceClient extends Client {
  private accessKey: string;
  constructor(accessKey: string, baseUrl: string) {
    const options = { baseUrl };

    super(options);
    this.accessKey = accessKey;
  }

  get headers() {
    return {
      ...super.headers,
      "Content-Type": "application/json",
      Accept: "application/json",
    };
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
    const { results, response } = await this.request<{ value: string }>(
      HttpRequest.Method.Get,
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
    );

    if (response.statusCode == null || response.statusCode >= 400) {
      throw new Error(
        `[6d12a0cf] getTokenValue failed with response code: ${response.statusCode}`,
      );
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

    const { results, response } = await this.post<{ uri: string }>({
      uri: "/tokens",
      body: { value },
    });

    if (response.statusCode == null || response.statusCode >= 400) {
      throw new Error(
        `[ec3424f2] saveToken failed with response code: ${response.statusCode}`,
      );
    }

    return results.uri;
  }
}
