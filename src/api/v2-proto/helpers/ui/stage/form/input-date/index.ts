// c8 ignore file
import { UI_Input_Date } from "../../../types/form/inputs/date.js";
import { PartiallyOptional } from "../../../types/index.js";
import { UI_Form_Row } from "../../../types/stage/index.js";
import * as templates from "./templates/index.js";

export const inputDate = (options: {
  definition?: PartiallyOptional<UI_Input_Date, "key" | "type" | "value">;
  template?: string;
}): UI_Form_Row => {
  const { definition, template } = options || {};
  return {
    type: "input",
    definition: {
      key: "date",
      type: "inputDate",
      value: {
        month: "",
        day: "",
        year: "",
      },
      label: {
        copy: "Date label",
      },
      hint: "",
      // Load Template
      ...((template && templates?.[template]) || {}),
      // Load overrides
      ...definition,
    },
  };
};
