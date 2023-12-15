import { SideEffect } from "@earnest/state-machine";
import ApplicationEvent from "../../contract/contract-types/application-event.js";

/**
 * All Application events
 */
export default new SideEffect<Assertions>({
  name: `ApplicationEvent`,
  predicate(assertions) {
    const applicationEventMutations = Object.values(
      assertions.mutations,
    ).filter(
      (mutation) =>
        mutation instanceof ApplicationEvent &&
        mutation.status === ApplicationEvent.Status.Pending &&
        mutation.definition,
    ) as ApplicationEvent[];

    if (!assertions.input.application) {
      const createApplicationMutations = applicationEventMutations.filter(
        (mutation) => mutation.definition?.event === "createApplication",
      );

      if (createApplicationMutations.length) {
        return createApplicationMutations;
      }
    }

    if (applicationEventMutations.length) {
      return applicationEventMutations;
    }
  },
  async effect(assertions, eventMutations: ApplicationEvent[]) {
    const { context, input } = assertions;

    const applicationEvents = (await Promise.all(
      eventMutations.map((event) => event.run(context, input)),
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
      } as Assertions;
    };
  },
});
