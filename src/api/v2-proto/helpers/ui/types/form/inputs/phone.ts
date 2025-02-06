// c8 ignore file
import type { UI_Input, UI_Input_Label } from "./index.js";

export interface UI_Input_Phone extends UI_Input {
  type: "inputPhone";
  value: string;
}
