import { UI_Predicate } from "../../conditional.js";
import { UI_Form_InfoComponent_Content } from "./content.js";
import { UI_Form_InfoComponent_Header } from "./header.js";

export interface UI_Form_InfoComponent {
  // Global Input Keys
  key: string;
  conditional?: UI_Predicate;
  features?: Array<string>;
}

export type UI_Form_InfoComponents =
  | UI_Form_InfoComponent_Header
  | UI_Form_InfoComponent_Content;
