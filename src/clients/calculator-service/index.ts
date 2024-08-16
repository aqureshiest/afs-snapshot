import PluginContext from "@earnest-labs/microservice-chassis/PluginContext.js";
import Client from "../client.js";

export default class CalculatorServiceClient extends Client {
  get clientName() {
    return "CalculatorService";
  }
  private accessKey: string;
  constructor(accessKey: string, baseUrl: string) {
    const options = { baseUrl };

    super(options);
    this.accessKey = accessKey;
  }

  async getMinPaymentPrice(
    context: PluginContext,
    paylod: GetMinPaymentPricePayload,
  ): Promise<{ [key: string]: unknown }> {
    const { results, response } = await this.post<{ [key: string]: unknown }>(
      {
        uri: "/payment-schedules/slr/ream",
        headers: {
          ...this.headers,
          Authorization: `Bearer ${this.accessKey}`,
        },
        body: paylod,
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
        `[f9678e02] getMinPayment failed with response code: ${response.statusCode}`,
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

    return results;
  }
}
