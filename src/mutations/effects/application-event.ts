import { SideEffect } from "@earnest/state-machine";
import ApplicationEvent from "../../contract/contract-types/application-event.js";

function createApplicationEventEffect(event: string): SideEffect<Assertions> {
  return new SideEffect({
    name: `ApplicationEvent:${event}`,
    predicate(assertions) {
      const { mutations } = assertions;

      const filteredEvents = mutations.filter(
        (mutation) =>
          mutation instanceof ApplicationEvent &&
          mutation.definition.event === event,
      ) as ApplicationEvent[];

      if (filteredEvents.length) {
        return filteredEvents;
      }
    },
    async effect(assertions, predicate: ApplicationEvent[]) {
      /* ============================== *
       * Plugin ApplicationService client requests here
       * ============================== */
      await Promise.all(
        predicate.map((event) => event.run(assertions.context)),
      );

      return (assertions) => {
        const remainingMutations = assertions.mutations.filter(
          (mutation) =>
            !(
              mutation instanceof ApplicationEvent &&
              mutation.definition.event === event
            ),
        );

        return {
          ...assertions,
          mutations: remainingMutations,
        };
      };
    },
  });
}

const createApplication = createApplicationEventEffect("createApplication");
const addDetails = createApplicationEventEffect("addDetails");
const addReference = createApplicationEventEffect("addReference");

export { createApplication, addDetails, addReference };
