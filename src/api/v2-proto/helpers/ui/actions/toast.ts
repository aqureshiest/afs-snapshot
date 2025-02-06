// c8 ignore file
import type { UI_Action_Error } from "../types/action.js";

type ToastAction = (options: {
  type: "error" | "success" | "notification" | "warning";
  message: string;
  icon?: string;
  autoDismissDelayMs?: number;
}) => UI_Action_Error;

const toastAction: ToastAction = ({
  type,
  message,
  icon,
  autoDismissDelayMs,
}) => {
  return {
    type: "error",
    key: "toast",
    properties: {
      type: "toast",
      definition: {
        type,
        message,
        icon,
        autoDismissDelayMs,
      },
    },
  };
};

export default toastAction;
