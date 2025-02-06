// c8 ignore file
import type { UI_Input, UI_Input_Label } from "./index.js";

export interface UI_Input_Name extends UI_Input {
  type: "inputName";
  value: {
    first: string;
    last: string;
  };
}
