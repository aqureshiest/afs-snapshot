import { SideEffectLayer } from "@earnest/state-machine";
import applicationEvent from "./application-event.js";
import execute from "./execute.js";

execute.dependsOn({ effect: applicationEvent });

export default new SideEffectLayer(execute, applicationEvent);
