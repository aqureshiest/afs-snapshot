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
  async getSchoolName(context: PluginContext, payload): Promise<string | null> {
    const school = await this.getSchool(context, payload);
    if (school) {
      return school.name;
    } else {
      return "[e4d2edad] failed to get School";
    }
  }

  async getSchool(
    context: PluginContext,
    payload,
  ): Promise<SchoolDetails | null> {
    const { results, response } = await this.get<SchoolDetails>({
      uri: `/schools/${String(payload.id)}`,
      headers: this.headers,
    });

    if (response.statusCode === 404) {
      return null;
    }

    if (response.statusCode && response.statusCode >= 400) {
      context.logger.error({
        message: response.statusMessage,
        statusCode: response.statusCode,
      });
      throw new Error(
        `[29b9ae42] Failed to get school information:  ${response.statusCode}, ${response.statusMessage}`,
      );
    } else {
      return results;
    }
  }

  async getSchools(
    context: PluginContext,
    payload: { opeid?: string; name?: string; loanType?: LoanType },
  ): Promise<Array<School>> {
    const { results, response } = await this.get<{
      schools: Array<School>;
    }>({
      uri: `/schools`,
      headers: this.headers,
      query: payload,
    });

    if (response.statusCode && response.statusCode >= 400) {
      context.logger.error({
        message: response.statusMessage,
        statusCode: response.statusCode,
      });
      throw new Error(
        `[730f8ada] Failed to get schools:  ${response.statusCode}, ${response.statusMessage} - ${response}`,
      );
    } else {
      return results.schools;
    }
  }
}
