// c8 ignore file
import { UI_Input_Email } from "../../../types/form/inputs/email.js";
import { PartiallyOptional } from "../../../types/index.js";
import { UI_Form_Row } from "../../../types/stage/index.js";

export const inputEmail = (
  definition: PartiallyOptional<UI_Input_Email, "key" | "type" | "value"> | void
): UI_Form_Row => {
  return {
    type: "input",
    definition: {
      key: "email",
      type: "inputEmail",
      placeholder: "Email address",
      label: {
        copy: "Email address",
      },
      ...definition,
    },
  };
};
