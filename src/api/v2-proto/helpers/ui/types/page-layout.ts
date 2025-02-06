// c8 ignore file
// import {
//   type StagedProgressProps,
//   type BannerProps,
//   type BottomnavDisclosureProps,
//   type IconProps
// } from "@earnest/nucleus-design-system";
import { UI_Action } from "./action.js";
import { UI_FlexibleContent } from "./flexible-content/index.js";

// TODO: This is a placeholder until we fix Nucleus props
type ReplaceWithIconProps = string;
type ReplaceWithBannerProps = {
  actionButtonProps?: Record<string, unknown>;
  additionalButtonProps?: Record<string, unknown>;
};

export type UI_PageLayout = {
  header?: UI_HeaderSection[];
  footer?: UI_FlexibleContent;
  banner?: UI_Banner;
};

export type UI_HeaderSection = {
  text?: string;
  logo?: boolean;
  icon?: ReplaceWithIconProps;
  action?: UI_Action;
};

export type UI_Banner = Omit<
  ReplaceWithBannerProps,
  "actionButtonProps" | "additionalButtonProps"
> & {
  actionButtonProps?: ReplaceWithBannerProps["actionButtonProps"] & {
    action?: UI_Action;
  };
  additionalButtonProps?: ReplaceWithBannerProps["additionalButtonProps"] & {
    action?: UI_Action;
  };
  iconEndOnClick?: {
    action?: UI_Action;
  };
};
