import PluginContext from "@earnest-labs/microservice-chassis/PluginContext.js";

import Client from "../client.js";

export default class AccreditedSchoolServiceClient extends Client {
  get clientName() {
    return "AccreditedSchoolService";
  }
  async getSchoolName(
    input: Input,
    context: PluginContext,
    payload,
  ): Promise<string | null> {
    let school;
    if (payload?.opeid || payload?.name) {
      school = (await this.getSchools(input, context, payload))?.[0];
    } else {
      school = await this.getSchool(input, context, payload);
    }
    if (school) {
      return school.name;
    } else {
      return null;
    }
  }

  async getSchool(
    input: Input,
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
    input: Input,
    context: PluginContext,
    payload: { opeid?: string; name?: string; loanType?: LoanType },
  ): Promise<Array<School>> {
    if (!payload.loanType && !payload.name && !payload.opeid) {
      this.error(input, `[28bb0233] Missing required parameters`);
    }

    const queryPayload = {
      ...(payload.loanType ? { loanType: payload.loanType } : {}),
      ...(payload.name ? { name: payload.name } : {}),
      ...(payload.opeid ? { opeid: payload.opeid } : {}),
    };

    const { results, response } = await this.get<{
      schools: Array<School>;
    }>(
      {
        uri: `/schools`,
        headers: this.headers,
        query: queryPayload,
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
