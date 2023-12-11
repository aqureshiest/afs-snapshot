import { SideEffect } from "@earnest/state-machine";
import ApplicationEvent from "../../contract/contract-types/application-event.js";

function createApplicationEventEffect(event: string): SideEffect<Assertions> {
  return new SideEffect({
    name: `ApplicationEvent:${event}`,
    predicate(assertions) {
      const { mutations } = assertions;

      const filteredMutations = Object.keys(mutations).filter((mutationKey) => {
        const mutation = mutations[mutationKey];
        return (
          mutation instanceof ApplicationEvent &&
          !mutation.mutated &&
          mutation.definition.event === event
        );
      });

      if (filteredMutations.length) {
        return filteredMutations;
      }
    },
    async effect(assertions, eventKeys: string[]) {
      /* ============================== *
       * Either an application must be present in the assertions
       * XOR the event must be "createApplication"
       * ============================== */
      const application = assertions.input.application;
      if (!application !== (event === "createApplication")) return;

      const { context, mutations, input } = assertions;

      const mutationEvents = eventKeys.map((eventKey) => mutations[eventKey]);

      /* ============================== *
       * Plugin ApplicationService client requests here
       * ============================== */
      const applicationEvents = (await Promise.all(
        mutationEvents.map((event) => event.run(context, input)),
      )) as ApplicationEvent["result"][];

      return (assertions) => {
        const applicationFromResponse = applicationEvents.reduce(
          (accumulator, event) => {
            const { application } = event;
            return { ...accumulator, ...application };
          },
          assertions.input.application || {},
        );

        return {
          ...assertions,
          input: {
            ...assertions.input,
            application: applicationFromResponse,
          },
          asOf: new Date(),
        } as Assertions;
      };
    },
  });
}

const createApplication = createApplicationEventEffect("createApplication");
const addDetails = createApplicationEventEffect("addDetails");
const addReference = createApplicationEventEffect("addReference");

export { createApplication, addDetails, addReference };
