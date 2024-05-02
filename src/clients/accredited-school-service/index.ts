import PluginContext from "@earnest-labs/microservice-chassis/PluginContext.js";

import Client from "../client.js";

export default class AccreditedSchoolServiceClient extends Client {
  get clientName() {
    return "AccreditedSchoolService";
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
    const { results, response } = await this.get<SchoolDetails>(
      {
        uri: `/schools/${String(payload.id)}`,
        headers: this.headers,
      },
      context,
    );

    if (response.statusCode === 404) {
      return null;
    }

    if (response.statusCode && response.statusCode >= 400) {
      const error = new Error(`[29b9ae42] Failed to get school information`);

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

  async getSchools(
    context: PluginContext,
    payload: { opeid?: string; name?: string; loanType?: LoanType },
  ): Promise<Array<School>> {
    const { results, response } = await this.get<{
      schools: Array<School>;
    }>(
      {
        uri: `/schools`,
        headers: this.headers,
        query: payload,
      },
      context,
    );

    if (response.statusCode && response.statusCode >= 400) {
      const error = new Error(`[730f8ada] Failed to get schools`);

      this.log(
        {
          error,
          message: response.statusMessage,
        },
        context,
      );

      throw error;
    }

    return results.schools;
  }
}
