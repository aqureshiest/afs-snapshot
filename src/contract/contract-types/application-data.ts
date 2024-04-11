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
  Application | [Application]
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
    if ("id" in definition) {
      const { application } = (await applicationServiceClient.sendRequest(
        {
          query: TEMP_DEFAULT_APPLICATION_QUERY,
          variables: { id: definition.id },
        },
        context,
      )) as unknown as { application: Application };

      return application;
    } else {
      assert(definition.criteria, "[0afdb895] search criteria is undefined");

      const { applications } = (await applicationServiceClient.sendRequest(
        {
          query: TEMP_DEFAULT_APPLICATIONS_QUERY,
          variables: {
            criteria: definition.criteria,
            ...(definition?.limit ? { limit: definition?.limit } : {}),
            ...(definition?.page ? { page: definition?.page } : {}),
          },
        },
        context,
      )) as unknown as { applications: [Application] };

      return applications;
    }
  };
}

export default ApplicationData;
