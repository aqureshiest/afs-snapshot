import { Client } from "@earnest/http";
import PluginContext from "@earnest-labs/microservice-chassis/PluginContext.js";
import { HttpRequest } from "@earnest/http";

export default class AccreditedSchoolServiceClient extends Client {
  constructor(context: PluginContext, baseUrl: string) {
    const options = { baseUrl };
    super(options);
  }
  get headers() {
    return {
      ...super.headers,
      "Content-Type": "application/json",
      Accept: "application/json",
    };
  }

  async getSchool(
    id: string,
    context: PluginContext,
  ): Promise<SchoolDetails | null> {
    const { results, response } = await this.get<SchoolDetails>({
      uri: `/schools/${String(id)}`,
      headers: this.headers,
    });

    if (response.statusCode === 404) {
      return null;
    }

    if (response.statusCode && response.statusCode >= 400) {
      const error = new Error("[29b9ae42] Failed to get school information");
      context.logger.error({
        error,
        message: error.message,
        statusCode: response.statusCode,
      });
      throw error;
    }

    return results;
  }

  async getSchools(
    search: { opeid?: string; name?: string; loanType?: LoanType },
    context: PluginContext,
  ): Promise<Array<School>> {
    context.logger.info(
      `[07709ff0] DEBUG Lorem ipsum dolor sit amet :: Requesting School Service :: search :: ${search}`,
    );
    const { results, response } = await this.request<{
      schools: Array<School>;
    }>(HttpRequest.Method.Get, {
      uri: `/schools`,
      query: search,
      headers: this.headers,
    });

    if (response.statusCode && response.statusCode >= 400) {
      const error = new Error("[730f8ada] Failed to get schools");
      context.logger.error({
        error,
        message: error.message,
        statusCode: response.statusCode,
      });
      throw error;
    }

    return results.schools;
  }
}
