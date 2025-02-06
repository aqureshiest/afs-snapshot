// c8 ignore file
// import { IconProps } from "@earnest/nucleus-design-system";
import type { UI_Flexible_ButtonGroup } from "./flexible-content/button-group.js";
import type { UI_HeaderDefinition } from "./flexible-content/header.js";
import type { UI_FlexibleContent } from "./flexible-content/index.js";
import type { UI_Analytics } from "./analytics.js";

// TODO: This is a placeholder until we fix Nucleus props
type ReplaceWithIconProps = string;

export type UI_ErrorPageDefinition = {
  header?: UI_HeaderDefinition;
  primaryAction?: UI_ActionButton;
  secondaryAction?: UI_ActionButton;
  content?: UI_FlexibleContent;
  bottomNavigation?: UI_Flexible_ButtonGroup;
};

export type UI_ToastErrorDefinition = {
  type: "notification" | "success" | "warning" | "error";
  message: string;
  icon?: ReplaceWithIconProps;
  autoDismissDelayMs?: number;
};

type UI_ActionType<T, P> = {
  key: string;
  type: T;
  properties: {
    analytics?: UI_Analytics | UI_Analytics[];
    onError?: UI_ActionOnError;
    onCompleteToast?: UI_ToastErrorDefinition;
  } & P;
};

export type UI_Action_Navigate = UI_ActionType<
  "navigate",
  {
    goTo: string;
    external?: boolean;
    target?: string;
  }
>;

export type UI_Action_DismissBanner = UI_ActionType<
  "dismissBanner",
  {
    active?: boolean;
  }
>;

export type UI_Action_Error = UI_ActionType<
  "error",
  {
    type: "toast" | "page";
    definition: UI_ErrorPageDefinition | UI_ToastErrorDefinition;
  }
>;

export type UI_Action_Interstitial = UI_ActionType<
  "interstitial",
  {
    showSpinner?: boolean;
    header: UI_HeaderDefinition;
    action?: UI_Action;
    actionDelay?: number;
    actionPayload?: Record<string, unknown>;
    duration?: number;
    progress?: number;
  }
>;

export type UI_Action_Logout = UI_ActionType<
  "logout",
  UI_Action_Navigate["properties"]
>;

export type UI_Action_Modal = UI_ActionType<
  "modal",
  {
    type: string;
    definition: Record<string, unknown>;
  }
>;

export type UI_Action_Request = UI_ActionType<
  "request",
  {
    method: "POST" | "GET" | "PUT" | "DELETE" | "PATCH";
    manifest: string;
  }
>;

export type UI_Action_Sidebar = UI_ActionType<
  "sidebar",
  {
    type: string;
    properties: { dark?: boolean } & Record<string, unknown>;
  }
>;

export type UI_Action =
  | UI_Action_Navigate
  | UI_Action_DismissBanner
  | UI_Action_Error
  | UI_Action_Interstitial
  | UI_Action_Logout
  | UI_Action_Modal
  | UI_Action_Request
  | UI_Action_Sidebar;

export type UI_ActionOnError = {
  codes: string[];
  action: UI_Action;
}[];

export type UI_ActionButton = {
  copy: string;
  disabled?: boolean;
  action: UI_Action;
};
