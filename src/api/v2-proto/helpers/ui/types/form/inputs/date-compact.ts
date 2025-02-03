// c8 ignore file
import type { UI_HeaderDefinition } from "../../flexible-content/header.js";
import type { UI_Input } from "./index.js";

export interface UI_Input_DateCompact extends UI_Input {
  type: "inputDateCompact";
  value?: {
    day: string;
    month: string;
    year: string;
  };
  omitDay?: boolean;
}