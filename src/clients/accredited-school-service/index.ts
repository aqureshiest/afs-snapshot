import { Client } from "@earnest/http";
import PluginContext from "@earnest-labs/microservice-chassis/PluginContext.js";

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
    const { results, response } = await this.get<{
      schools: Array<School>;
    }>({
      uri: `/schools`,
      query: search,
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
