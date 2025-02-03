// c8 ignore file
import type { UI_HeaderDefinition } from "../../flexible-content/header.js";
import type { UI_Input } from "./index.js";

export interface UI_Input_Checkbox extends UI_Input {
  type: 'inputCheckbox';
  /** used if as the checkbox value only if text is present */
  value: unknown | Array<unknown>;
  /** if present, it renders a single checkbox */
  text?: string;
  /** if present, it renders renders multiple checkboxes (as an array of values) */
  items?: Array<{ value: boolean; copy: string; id: string }>;
  metadata?: {
    stylePreset: "defaultCheckboxList";
  };
  header?: UI_HeaderDefinition;
}