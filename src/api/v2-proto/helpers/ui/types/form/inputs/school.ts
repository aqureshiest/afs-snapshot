// c8 ignore file
import type { UI_Input, UI_Input_Label } from "./index.js";

type School = {
  id: number;
  opeid8: string;
  name: string;
  address: string;
  state: string;
  city: string;
  country: string;
  loanTypes: string[];
};

export interface UI_Input_School extends UI_Input {
  type: "inputSchool";
  value?: Pick<School, "name" | "city" | "state" | "opeid8" | "loanTypes">;
  label?: UI_Input_Label;
}
