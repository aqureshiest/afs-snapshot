// c8 ignore file
import { UI_Form_InfoComponent_Header } from "../../../types/form/info/header.js";
import { PartiallyOptional } from "../../../types/index.js";
import { UI_Form_Row } from "../../../types/stage/index.js";

export const infoHeader = (
  definition: PartiallyOptional<UI_Form_InfoComponent_Header, "key" | "type">
): UI_Form_Row => {
  return {
    type: "info",
    definition: {
      key: "header",
      type: "infoHeader",
      ...definition,
    },
  };
};
