// c8 ignore file
import type { UI_HeaderDefinition } from "../../flexible-content/header.js";
import type { UI_Input } from "./index.js";

export interface UI_Input_Email extends UI_Input {
  type: "inputEmail";
  value?: string;
}
