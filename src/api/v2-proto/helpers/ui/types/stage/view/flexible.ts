// c8 ignore file
import type { UI_FlexibleContent } from "../../flexible-content/index.js";
import type { UI_Action, UI_ActionButton } from "../../action.js";
import type { UI_View } from "../index.js";

export type UI_View_Flexible = UI_View<
  "flexible",
  {
    content: UI_FlexibleContent;
    primaryAction?: UI_ActionButton;
    secondaryAction?: UI_ActionButton;
    backAction?: UI_Action;
  }
>;
