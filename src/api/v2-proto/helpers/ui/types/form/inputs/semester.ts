// c8 ignore file
import type { UI_Input, UI_Input_Label } from "./index.js";

export interface UI_Input_Semester extends UI_Input {
  type: "inputSemester";
  value?: {
    semester: string;
    year: string;
  };
  years: Array<{
    value: string;
    textValue: string;
  }>;
}