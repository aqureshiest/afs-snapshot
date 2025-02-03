// c8 ignore file
import { UI_Analytics } from "../../analytics.js";
import { UI_Predicate } from "../../conditional.js";
import { UI_FlexibleContent } from "../../flexible-content/index.js";

// Inputs
import { UI_Input_Address } from "./address.js";
import { UI_Input_Checkbox } from "./checkbox.js";
import { UI_Input_DateCompact } from "./date-compact.js";
import { UI_Input_DateRange } from "./date-range.js";
import { UI_Input_Date } from "./date.js";
import { UI_Input_Email } from "./email.js";
import { UI_Input_Money } from "./money.js";
import { UI_Input_MoneyArray } from "./moneyArray.js";
import { UI_Input_Name } from "./name.js";
import { UI_Input_Phone } from "./phone.js";
import { UI_Input_Radio, UI_Input_Radio_Detailed } from "./radio.js";
import { UI_Input_School } from "./school.js";
import { UI_Input_Select } from "./select.js";
import { UI_Input_Semester } from "./semester.js";
import { UI_Input_Ssn } from "./ssn.js";
import { UI_Input_Text } from "./text.js";

export type UI_Input_Label = {
  copy: string;
  subCopy?: string;
  labelAsHeader?: boolean;
}

export interface UI_Input {
  key: string;
  errors?: Array<{
    type: string;
    message: string;
  }>;
  label?: UI_Input_Label;
  labels?: Record<string, UI_Input_Label>;
  placeholder?: string;
  placeholders?: Record<string, string>;
  disabled?: boolean;
  hint?: string | UI_FlexibleContent;
  deps?: string[];
  validation?: undefined;
  conditional?: UI_Predicate;
  analyticsEvents?: UI_Analytics;
}

export type UI_Inputs =
  | UI_Input_Address
  | UI_Input_Checkbox
  | UI_Input_Date
  | UI_Input_DateCompact
  | UI_Input_DateRange
  | UI_Input_Email
  | UI_Input_Money
  | UI_Input_MoneyArray
  | UI_Input_Name
  | UI_Input_Phone
  | UI_Input_Radio
  | UI_Input_Radio_Detailed
  | UI_Input_School
  | UI_Input_Select
  | UI_Input_Semester
  | UI_Input_Ssn
  | UI_Input_Text