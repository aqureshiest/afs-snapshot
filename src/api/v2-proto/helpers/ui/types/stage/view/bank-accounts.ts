// c8 ignore file
import type { UI_FlexibleContent } from "../../flexible-content/index.js";
import type { UI_Flexible_List } from "../../flexible-content/list.js";
import type { UI_Action, UI_ActionButton } from "../../action.js";
import type { UI_Analytics } from "../../analytics.js";
import type { UI_Asset } from "../../asset.js";
import type { UI_View } from "../index.js";

type Callout = {
  key: string;
  copy: string;
};

type CalloutsDefinition = {
  items?: Array<Callout>;
  header?: string;
  direction?: "row" | "column";
};

type Account = {
  selected?: boolean;
  index?: string;
  name: string;
  type: string;
  account_last4: string;
  balance: number;
};

export type UI_View_BankAccounts = UI_View<"BankAccounts", {
  centered?: boolean;
  header: {
    asset?: UI_Asset;
    copy: string;
    subCopy?: string;
  };
  list?: UI_Flexible_List;
  trustpilot?: boolean;
  callouts?: CalloutsDefinition;
  disclosure?: string | UI_FlexibleContent;
  primaryAction: UI_ActionButton;
  secondaryAction?: UI_ActionButton;
  backAction?: UI_Action;
  content?: UI_FlexibleContent;
  plaidOptions?: {
    linkToken: string;
    tokenUrl?: string;
    exchangeUrl: string;
    onError?: UI_Action["properties"]["onError"];
    onCompleteToast?: UI_Action["properties"]["onCompleteToast"];
  };
  analyticsEvents?: {
    plaidOpened?: UI_Analytics;
    plaidClosed?: UI_Analytics;
    plaidSubmitted?: UI_Analytics;
    manualOpened?: UI_Analytics;
    manualClosed?: UI_Analytics;
    manualSubmitted?: UI_Analytics;
  };
  financialAccounts?: Array<Account>;
}>;