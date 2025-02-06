// c8 ignore file
import type { UI_HeaderDefinition } from "../../flexible-content/header.js";
import type { UI_Form_InfoComponent } from "./index.js";

export interface UI_Form_InfoComponent_Header extends UI_Form_InfoComponent {
  type: "infoHeader";
  header: UI_HeaderDefinition;
}
