import { SideEffectLayer } from "@earnest/state-machine";
import * as applicationEvent from "./application-event.js";

/* ============================== *
 * Establish dependencies
 * ============================== */
applicationEvent.addDetails.dependsOn({
  effect: applicationEvent.createApplication,
});
applicationEvent.addReference.dependsOn({
  effect: applicationEvent.createApplication,
});

export default new SideEffectLayer(
  applicationEvent.createApplication,
  applicationEvent.addDetails,
  applicationEvent.addReference,
);
