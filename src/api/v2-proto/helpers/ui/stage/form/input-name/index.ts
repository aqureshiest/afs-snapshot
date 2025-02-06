// c8 ignore file
import { UI_Input_Name } from "../../../types/form/inputs/name.js";
import { PartiallyOptional } from "../../../types/index.js";
import { UI_Form_Row } from "../../../types/stage/index.js";

export const inputName = (
  definition: PartiallyOptional<UI_Input_Name, "key" | "type" | "value">,
): UI_Form_Row => {
  return {
    type: "input",
    definition: {
      key: "name",
      type: "inputName",
      placeholders: {
        first: "First name",
        last: "Last name",
      },
      value: {
        first: "",
        last: "",
      },
      label: {
        copy: "Full legal name",
      },
      ...definition,
    },
  };
};
