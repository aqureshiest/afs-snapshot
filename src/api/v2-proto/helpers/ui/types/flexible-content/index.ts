// c8 ignore file
// import { XResponsiveCSSProps } from "@earnest/nucleus-design-system";
import { UI_Predicate } from "../conditional.js";
import { UI_Flexible_Header } from "./header.js";
import { UI_Flexible_Callout } from "./callout.js";
import { UI_Flexible_Table } from "./table.js";
import { UI_Flexible_RatesTable } from "./rates-table.js";
import { UI_Flexible_Md } from "./md.js";
import { UI_Flexible_Row } from "./row.js";
import { UI_Flexible_ButtonGroup } from "./button-group.js";
import { UI_Flexible_List } from "./list.js";
import { UI_Flexible_StatLineGroup } from "./stat-line-group.js";
import { UI_Flexible_ActionButton } from "./action-button.js";
import { UI_Flexible_ProgressCard } from "./progress-card.js";

type UI_FlexibleContentItem<T, P> = {
  key: string;
  type: T;
  componentProps: P;
  componentPropsMobile?: Partial<P>;
  containerProps?: Record<string, unknown>;
  containerPropsMobile?: Record<string, unknown>;
  conditional?: UI_Predicate;
};

type UI_ContentTypes =
  | UI_FlexibleContentItem<"header", UI_Flexible_Header>
  | UI_FlexibleContentItem<"callout", UI_Flexible_Callout>
  | UI_FlexibleContentItem<"table", UI_Flexible_Table>
  | UI_FlexibleContentItem<"ratesTable", UI_Flexible_RatesTable>
  | UI_FlexibleContentItem<"md", UI_Flexible_Md>
  | UI_FlexibleContentItem<"row", UI_Flexible_Row>
  | UI_FlexibleContentItem<"buttons", UI_Flexible_ButtonGroup>
  | UI_FlexibleContentItem<"list", UI_Flexible_List>
  | UI_FlexibleContentItem<"statLineGroup", UI_Flexible_StatLineGroup>
  | UI_FlexibleContentItem<"trustPilot", void>
  | UI_FlexibleContentItem<"action", UI_Flexible_ActionButton>
  | UI_FlexibleContentItem<"progressCard", UI_Flexible_ProgressCard>
  | UI_FlexibleContentItem<"divider", void>
  | UI_FlexibleContentItem<"asset", void>;

type UI_FlexibleContent = UI_ContentTypes[];

export type { UI_FlexibleContent, UI_FlexibleContentItem, UI_ContentTypes };
