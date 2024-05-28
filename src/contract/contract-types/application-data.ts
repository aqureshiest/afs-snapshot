import assert from "node:assert";
import { Application } from "@earnest/application-service-client/typings/codegen.js";
import ContractType from "./base-contract.js";
import {
  TEMP_DEFAULT_APPLICATION_QUERY,
  TEMP_DEFAULT_APPLICATIONS_QUERY,
} from "../../clients/application-service/graphql.js";

class ApplicationData extends ContractType<
  Definition,
  Definition,
  Application | Application[] | null
> {
  get contractName(): string {
    return "ApplicationData";
  }

  condition = () => true;

  /**
   *
   */
  evaluate = async (
    input: Input,
    injections: Injections,
    definition: Definition,
  ) => {
    const { context } = injections;
    const applicationServiceClient =
      context.loadedPlugins.applicationServiceClient.instance;

    assert(
      applicationServiceClient,
      "[52fb1e44] ApplicationServiceClient not instantiated",
    );
    if (definition["id"]) {
      const { application } = (await applicationServiceClient.sendRequest(
        {
          query: TEMP_DEFAULT_APPLICATION_QUERY,
          variables: { id: definition["id"] },
        },
        context,
      )) as unknown as { application: Application };

      return application;
    } else if ("criteria" in definition) {
      if (definition.criteria.length === 0) {
        return [] as Application[];
      }

      const limit =
        definition.limit != null ? Number(definition.limit) : undefined;
      const page =
        definition.page != null ? Number(definition.page) : undefined;

      const { applications } = (await applicationServiceClient.sendRequest(
        {
          query: TEMP_DEFAULT_APPLICATIONS_QUERY,
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
