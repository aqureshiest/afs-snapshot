// c8 ignore file
// import { XResponsiveCSSProps } from "@earnest/nucleus-design-system";
import { UI_FlexibleContent } from "./index.js";

export type UI_Flexible_Row = {
  content: UI_FlexibleContent;
  flexProps?: Record<string, unknown>;
  stackOnMobile?: boolean;
  globalBoxProps?: Record<string, unknown>;
};
