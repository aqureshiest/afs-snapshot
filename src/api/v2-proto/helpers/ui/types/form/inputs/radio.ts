// c8 ignore file
import type { UI_Input } from "./index.js";

export interface UI_Input_Radio extends UI_Input {
  type: "inputRadio";
  direction: "row" | "column";
  value?: string;
  layout: "default";
  items: Array<{
    id: string;
    label: string;
    value: string;
  }>;
}

export interface UI_Input_Radio_Detailed extends UI_Input {
  type: "inputRadio";
  direction: "row" | "column";
  value?: string;
  layout: "detailed";
  items: Array<{
    id: string;
    label: string;
    copy?: string;
    value: string;
    icon?: string;
  }>;
}