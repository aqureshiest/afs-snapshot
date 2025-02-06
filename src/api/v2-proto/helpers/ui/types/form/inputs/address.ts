// c8 ignore file
import { UI_Input, UI_Input_Label } from "./index.js";

export interface UI_Input_Address extends UI_Input {
  type: "inputAddress";
  value?: {
    street: string;
    apt?: string;
    city: string;
    state: string;
    zip: string;
  };
  labels?: {
    street?: UI_Input_Label;
    apt?: UI_Input_Label;
    city?: UI_Input_Label;
    state?: UI_Input_Label;
    zip?: UI_Input_Label;
    base?: UI_Input_Label;
  };
  reviewStyle?: boolean;
  expanded?: boolean;
}
