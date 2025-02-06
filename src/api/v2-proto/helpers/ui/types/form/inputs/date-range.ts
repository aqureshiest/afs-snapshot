// c8 ignore file
import type { UI_HeaderDefinition } from "../../flexible-content/header.js";
import type { UI_Input } from "./index.js";

export interface UI_Input_DateRange extends UI_Input {
  type: "inputDateRange";
  value?: {
    startDate: string;
    endDate: string;
  };
}
