import { SideEffectLayer } from "@earnest/state-machine";
import * as applicationEvent from "./application-event.js";
import execute from "./execute.js";

/* ============================== *
 * Establish dependencies
 * ============================== */
applicationEvent.addDetails.dependsOn({
  effect: applicationEvent.createApplication,
});

applicationEvent.addReference.dependsOn({
  effect: applicationEvent.createApplication,
});

execute.dependsOn(
  { effect: applicationEvent.addDetails },
  { effect: applicationEvent.addReference },
  { effect: applicationEvent.createApplication },
);

export default new SideEffectLayer(
  execute,
  applicationEvent.createApplication,
  applicationEvent.addDetails,
  applicationEvent.addReference,
);
