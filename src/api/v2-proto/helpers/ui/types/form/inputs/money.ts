// c8 ignore file
import type { UI_Input } from "./index.js";

export interface UI_Input_Money extends UI_Input {
  type: "inputMoney";
  value?: number | string;
  valueAsString?: boolean;
  inputProps?: Record<string, unknown>;
}