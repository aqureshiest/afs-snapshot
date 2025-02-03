// c8 ignore file
// import type React from "react";
// import {
//   ButtonProps,
//   ButtonGroupProps as _ButtonGroupProps,
//   IconProps
// } from "@earnest/nucleus-design-system";
import { UI_Action } from "../action.js";

type ReplaceWithButtonProps = Record<string, unknown>;
type ReplaceWithButtonGroupProps = Record<string, unknown>;
type ReplaceWithIconProps = string;

export type UI_BaseButton = {
  copy?: string;
  action?: UI_Action;
} & ReplaceWithButtonProps;

export type UI_IconButton = {
  icon?: ReplaceWithIconProps;
  action?: UI_Action;
} & ReplaceWithButtonProps;

export type UI_Flexible_ButtonGroup = {
  buttons: Array<UI_BaseButton | UI_IconButton>;
  globalButtonsProps?: ReplaceWithButtonProps;
  stylePreset?: string;
  groupProps?: ReplaceWithButtonGroupProps;
};
