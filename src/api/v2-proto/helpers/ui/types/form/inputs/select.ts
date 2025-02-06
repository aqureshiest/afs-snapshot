// c8 ignore file
import type { UI_Input, UI_Input_Label } from "./index.js";

export interface UI_Input_Select extends UI_Input {
  type: "inputSelect";
  value?: string;
  items: Array<{
    id: string;
    label: string;
    value: string;
  }>;
}
