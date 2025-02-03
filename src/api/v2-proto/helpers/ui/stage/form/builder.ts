// c8 ignore file
import { toKebabCase } from "../../../transforms/kebab-case.js";
import { UI_PageLayout } from "../../types/page-layout.js";
import { UI_Form, UI_Stage } from "../../types/stage/index.js";

export type FormBuilder = (opts: {
  manifest: string;
  id: string;
  label: string;
  pageLayout?: UI_PageLayout;
  analytics?: UI_Stage["stage"]["analytics"];
  seo?: UI_Stage["stage"]["seo"];
  steps: UI_Stage<UI_Form>["stage"]["steps"];
  validation?: UI_Stage<UI_Form>["stage"]["validation"];
}) => UI_Stage<UI_Form>;

export const form: FormBuilder = ({
  manifest,
  id,
  label,
  pageLayout,
  analytics,
  seo,
  steps,
  validation,
}) => {
  return {
    manifest,
    id,
    stage: {
      label,
      type: "form",
      key: toKebabCase(label),
      pageLayout,
      analytics,
      seo,
      steps,
      validation,
    },
  };
};
