import assert from "node:assert";
import { Application } from "@earnest/application-service-client/typings/codegen.js";
import ContractType from "./base-contract.js";
import { TEMP_DEFAULT_APPLICATION_QUERY, TEMP_DEFAULT_APPLICATIONS_QUERY } from "../../clients/application-service/graphql.js";

class ApplicationData extends ContractType<Definition, Definition, Application | [Application]> {
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
      return applicationServiceClient.sendRequest({
          query: TEMP_DEFAULT_APPLICATION_QUERY,
          variables: { id: definition.id },
        }, context) as unknown as Application;
    } else {
      return applicationServiceClient.sendRequest({
        query: TEMP_DEFAULT_APPLICATIONS_QUERY,
        variables: { search: definition.criteria },
      }, context) as unknown as [Application];
    }
  };
}

export default ApplicationData;
