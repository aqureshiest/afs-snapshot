import PluginContext from "@earnest-labs/microservice-chassis/PluginContext.js";
import Client from "../client.js";

export enum AttributionConversionEvent {
  'SLR_QS' = 'SLR_QS',
  'APPLICATION_SUBMIT' = 'APPLICATION_SUBMIT'
}

export enum AttributionConversionEventPath {
  'SLR_QS' = 'student-refi-quick-score',
  'APPLICATION_SUBMIT' = 'application-submit'
}

export type AttributionEventRequest = {
  user_id?: string;
  application_id: string;
  // source, referral_codes and device_id may be made required in the handler,
  // depending on the value of attributionEventPath
  device_id?: string;
  referral_codes?: Array<string>;
  misc?: {
    click_id?: string;
    email?: string;
  };
};
export type AttributionEventResponse = {
  id: number;
  device_id?: string;
  event: AttributionConversionEvent;
  user_id: string;
  pre_application_id?: number;
  application_id: string;
  created_at: string;
  misc: {
    click_id: string;
    email: string;
  };
  source: string;
};

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
    const { results, response } =
      await this.post<AttributionEventResponse>({
        headers: this.headers,
        uri: `/api/attribution/${event}`,
        body
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