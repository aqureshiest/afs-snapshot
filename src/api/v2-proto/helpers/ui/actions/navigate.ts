// c8 ignore file
import { keyGen } from "../../transforms/key-gen.js";
import { UI_Action_Navigate } from "../types/action.js";


export const navigateAction = ({ goTo, external, analytics}: UI_Action_Navigate["properties"]): UI_Action_Navigate => {
  return {
    type: "navigate",
    key: keyGen('navigate'),
    properties: {
      analytics,
      goTo,
      external
    }
  }
}