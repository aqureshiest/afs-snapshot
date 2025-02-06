// c8 ignore file
import type { UI_HeaderDefinition } from "../../flexible-content/header.js";
import { UI_FlexibleContent } from "../../flexible-content/index.js";
import type { UI_Form_InfoComponent } from "./index.js";

export interface UI_Form_InfoComponent_Content extends UI_Form_InfoComponent {
  type: "infoContent";
  content: UI_FlexibleContent;
}
