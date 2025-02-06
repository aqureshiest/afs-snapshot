// c8 ignore file
import type { UI_Input } from "./index.js";

export interface UI_Input_Text extends UI_Input {
  type: "inputText";
  value?: string;
  inputProps?: Record<string, unknown>;
}
