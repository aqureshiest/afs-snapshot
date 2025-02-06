// c8 ignore file
import { keyGen } from "../../transforms/key-gen.js";
import { UI_Action_Request } from "../types/action.js";

export const requestAction = ({
  manifest,
  analytics,
  id,
}: Omit<UI_Action_Request["properties"], "method"> & {
  id?: string;
}): UI_Action_Request => {
  return {
    type: "request",
    key: keyGen("request"),
    properties: {
      analytics,
      manifest: `${manifest}${id ? `/${id}` : ""}`,
      method: "POST",
    },
  };
};
