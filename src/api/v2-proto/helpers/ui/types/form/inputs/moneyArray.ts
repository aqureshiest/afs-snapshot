// c8 ignore file
import type { UI_Input, UI_Input_Label } from "./index.js";

export interface UI_Input_MoneyArray extends UI_Input {
  type: "inputMoneyArray";
  value?: Array<{value: number | string; type?: string}>; 
  inputProps?: Record<string, unknown>;
  callout?: string;
  types: {
    hint?: string;
    label?: UI_Input_Label;
    items?: { id: string; label: string; value: string }[];
  };
}