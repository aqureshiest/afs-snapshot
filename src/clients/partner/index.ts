import PluginContext from "@earnest-labs/microservice-chassis/PluginContext.js";
import Client from "../client.js";
export default class PartnerClient extends Client {
  get clientName() {
    return "PartnerClient";
  }

  constructor(baseUrl: string) {
    const options = { baseUrl };
    super(options);
  }

  /**
   * Saves any updated application statuses to the Application Database
   * that we recieve from Lending Decision Service via the webhook interface
   * they interact with.
   * @param context PluginContext
   * @param id string - Application ID
   */
  async saveAttributionEvent(
    context: PluginContext,
    event: string,
    body: AttributionEventRequest,
  ): Promise<AttributionEventResponse> {
    const { results, response } = await this.post<AttributionEventResponse>({
      headers: this.headers,
      uri: `/api/attribution/${event}`,
      body,
    });

    if (!response.statusCode || response.statusCode > 300) {
      const error = new Error(
        `[e263cc43] saveAttributionEvent failed with response code: ${response.statusCode}`,
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
