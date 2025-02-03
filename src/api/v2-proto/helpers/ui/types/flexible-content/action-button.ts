// c8 ignore file
// import type React from "react";
// import type { ButtonProps } from "@earnest/nucleus-design-system";
import { UI_Action, UI_ActionButton } from "../action.js";

// TODO: This is a placeholder for the actual ButtonProps type until we can fix Nucleus
// type NucleusButtonProps = ButtonProps<React.ElementType<HTMLButtonElement>>;
type NucleusButtonProps = Record<string, unknown>;

export type UI_Flexible_ActionButton = {
  button?: UI_ActionButton;
  styleAsLink?: boolean;
  testId?: string;
  payload?: Record<string, unknown>;
  disabled?: boolean;
  withSpinner?: boolean;
  backAction?: UI_Action;
  className?: string;
} & NucleusButtonProps;