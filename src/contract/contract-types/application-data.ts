import assert from "node:assert";
import { Application } from "@earnest/application-service-client/typings/codegen.js";
import ContractExecutable from "../contract-executable.js";
import {
  TEMP_DEFAULT_APPLICATION_QUERY,
  TEMP_DEFAULT_APPLICATIONS_QUERY,
} from "../../clients/application-service/graphql.js";
import createError from "http-errors";

class ApplicationData extends ContractExecutable<
  Definition,
  Definition,
  Application | Application[] | null
> {
  get executionName(): string {
    return "ApplicationData";
  }

  condition = (_, __, ___, transformation: Definition | null) => {
    return Boolean(transformation);
  };

  /**
   *
   */
  evaluate = async (
    context: Context,
    executionContext,
    input: Input,
    definition: Definition,
  ) => {
    const applicationServiceClient =
      context.loadedPlugins.applicationServiceClient.instance;

    assert(
      applicationServiceClient,
      "[52fb1e44] ApplicationServiceClient not instantiated",
    );

    if (definition && "id" in definition) {
      try {
        const { application } = (await applicationServiceClient.sendRequest(
          {
            query: TEMP_DEFAULT_APPLICATION_QUERY,
            variables: definition,
          },
          context,
        )) as unknown as { application: Application };

        return application;
      } catch (err) {
        this.error(executionContext, err);
        return {} as unknown as Application;
      }
    } else if (definition && "criteria" in definition) {
      if (definition.criteria.length === 0) {
        return [] as Application[];
      }

      const limit =
        definition.limit != null ? Number(definition.limit) : undefined;
      const page =
        definition.page != null ? Number(definition.page) : undefined;

      const { applications } = (await applicationServiceClient.sendRequest(
        {
          query: definition["query"] || TEMP_DEFAULT_APPLICATIONS_QUERY,
          variables: {
            criteria: definition["criteria"],
            limit: Number.isNaN(limit) ? undefined : limit,
            page: Number.isNaN(page) ? undefined : page,
          },
        },
        context,
      )) as unknown as { applications: [Application] };

      return applications;
    }
    return null;
  };
}

export default ApplicationData;
