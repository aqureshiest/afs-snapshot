import PluginContext from "@earnest-labs/microservice-chassis/PluginContext.js";

import Client from "../client.js";

export default class AccreditedSchoolServiceClient extends Client {
  get clientName() {
    return "AccreditedSchoolService";
  }
  async getSchoolName(
    input: Input<unknown>,
    context: PluginContext,
    payload,
  ): Promise<string | null> {
    const school = (await this.getSchools(input, context, payload))?.[0];
    return school ? school.name : null;
  }

  async getSchool(
    input: Input<unknown>,
    context: PluginContext,
    payload,
  ): Promise<School | null> {
    if (!payload.opeid) {
      return null;
    }
    const school = (await this.getSchools(input, context, payload))?.[0];

    return school ? school : null;
  }

  async getSchools(
    input: Input<unknown>,
    context: PluginContext,
    payload: { opeid?: string | null; name?: string; loanType?: LoanType },
  ): Promise<Array<School>> {
    if (!payload.loanType && !payload.name && !payload.opeid) {
      throw new Error(`[28bb0233] Missing required parameters`);
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
