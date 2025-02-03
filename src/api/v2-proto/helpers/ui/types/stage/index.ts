// c8 ignore file
import type { UI_Form_InfoComponents } from "../form/info/index.js";
import type { UI_Inputs } from "../form/inputs/index.js";
import type { UI_PageLayout } from "../page-layout.js";
import type { UI_Predicate } from "../conditional.js";
import type { UI_Analytics } from "../analytics.js";
import type { UI_Views } from "./view/index.js";
import type { UI_Action } from "../action.js";

export type UI_Stage_Progress = {
  key: string;
  value: number;
  label?: string;
}

export type UI_Stage<Props = (UI_Views | UI_Form)> = {
  manifest: string;
  id?: string;
  stage: {
    key: string;
    label: string;
    pageLayout?: UI_PageLayout;
    onLoadAction?: UI_Action;
    onLoadEvent?: UI_Analytics;
    analytics?: UI_Analytics;
    conditionPresets?: Record<string, UI_Predicate>;
    progress?: UI_Stage_Progress[];
    seo?: {
      pageTitle?: string;
    };
  } & Props;
}

export type UI_View<Type, Def> = {
  type: "view";
  definition: {
    type: Type;
    definition: { key: string } & Def;
  };
}

export type UI_Form = {
  type: "form";
  steps: UI_Form_Step[];
  validation?: Record<string, unknown>;
}

export type UI_Form_Step_SubmitButton = {
  copy?: string;
  disabled?: boolean;
  action?: UI_Action;
  disclosure?: {
    copy?: string;
    disclosureProps?: Record<string, unknown>;
  };
  conditional?: UI_Predicate;
}

export type UI_Form_Row = {
  type: "input"
  definition: UI_Inputs
} | {
  type: "info"
  definition: UI_Form_InfoComponents
}

export type UI_Form_Step = {
  // Properties shared with Stage
  // Setting one of these will take precedence over the value set in the stage
  key: UI_Stage["stage"]["key"];
  label: UI_Stage["stage"]["label"];
  conditionPresets?: UI_Stage["stage"]["conditionPresets"];
  conditional?: UI_Stage["stage"]["conditionPresets"];
  progress?: UI_Stage["stage"]["progress"];
  analytics?: UI_Stage["stage"]["analytics"];
  seo?: UI_Stage["stage"]["seo"];
  // Form Step Specific Properties
  rows?: Array<UI_Form_Row>;
  submit: UI_Form_Step_SubmitButton | UI_Form_Step_SubmitButton[];
  back?: {
    action: UI_Action;
    hidden?: boolean;
  };
}