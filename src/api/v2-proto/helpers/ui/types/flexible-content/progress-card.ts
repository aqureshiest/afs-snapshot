// c8 ignore file
import { UI_Action } from "../action.js";
import { UI_Asset } from "../asset.js";

export type UI_Flexible_ProgressCard = {
  testId?: string;
  label: string;
  status: string | UI_Asset
  progress: number; // 0-100
  action?: UI_Action; // click action
}