// c8 ignore file
import { toKebabCase } from "../../../transforms/kebab-case.js";
import { UI_Stage } from "../../types/stage/index.js";
import { UI_View_Flexible } from "../../types/stage/view/flexible.js";

type FlexibleViewFn = (opts: {
  manifest: UI_Stage["manifest"];
  id: UI_Stage["id"];
  label: string;
  definition: Omit<UI_View_Flexible["definition"]["definition"], "key">;
}) => UI_Stage<UI_View_Flexible>;

export const flexibleView: FlexibleViewFn = ({
  manifest,
  id,
  label,
  definition,
}) => {
  const key = toKebabCase(label);
  return {
    manifest,
    id,
    stage: {
      type: "view",
      label,
      key,
      definition: {
        type: "flexible",
        definition: {
          key,
          ...definition,
        },
      },
    },
  };
};
