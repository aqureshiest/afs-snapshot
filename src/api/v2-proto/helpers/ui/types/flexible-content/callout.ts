// c8 ignore file
// import { XResponsiveCSSProps } from "@earnest/nucleus-design-system";
import { UI_FlexibleContent } from "./index.js";

type ReplaceWithCssProps = Record<string, unknown>;

export type UI_Flexible_Callout = {
  content?: UI_FlexibleContent;
  className?: string;
  testId?: string;
} & ReplaceWithCssProps;
