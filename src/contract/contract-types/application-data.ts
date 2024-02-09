import assert from "node:assert";
import ContractType from "./base-contract.js";

class ApplicationData extends ContractType<Definition, Definition, Output> {
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
      return applicationServiceClient.getApplication(context, definition.id);
    } else {
      return applicationServiceClient.getApplications(
        context,
        definition.criteria,
      );
    }
  };
}

export default ApplicationData;
