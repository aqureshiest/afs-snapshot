// c8 ignore file
import { UI_Form_InfoComponent_Content } from "../../../types/form/info/content.js";
import { PartiallyOptional } from "../../../types/index.js";
import { UI_Form_Row } from "../../../types/stage/index.js";

export const infoContent = (
  definition: PartiallyOptional<UI_Form_InfoComponent_Content, "key" | "type">
): UI_Form_Row => {
  return {
    type: "info",
    definition: {
      key: "content",
      type: "infoContent",
      ...definition,
    },
  };
};
