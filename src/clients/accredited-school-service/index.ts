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
      headers: this.headers,
    });

    if (response.statusCode === 404) {
      return null;
    }

    if (response.statusCode && response.statusCode >= 400) {
      context.logger.error({
        message: `[29b9ae42] Failed to get school information`,
        statusCode: response.statusCode,
      });
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
      headers: this.headers,
      query: search,
    });

    if (response.statusCode && response.statusCode >= 400) {
      context.logger.error({
        message: "[730f8ada] Failed to get schools",
        statusCode: response.statusCode,
      });
    }

    return results.schools;
  }
}
