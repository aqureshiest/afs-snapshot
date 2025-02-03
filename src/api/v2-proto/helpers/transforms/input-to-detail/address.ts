// c8 ignore file
import * as typings from "@earnest/application-service-client/typings/codegen.js";
import { UI_Input_Address } from "../../ui/types/form/inputs/address.js";

export const inputAddressToDetail = (
  input: UI_Input_Address["value"] | undefined,
  options: Pick<typings.LocationDetail, "type" | "citizenship" | "index"> = {}
): typings.AddDetailInput["location"] | undefined => {
  const { street, apt, city, state, zip } = input || {};

  return input
    ? [
        {
          index: 0,
          type: "primary",
          ...(street ? { street1: street } : {}),
          ...(apt ? { street2: apt } : {}),
          ...(city ? { city } : {}),
          ...(state ? { state } : {}),
          ...(zip ? { zip } : {}),
          ...options,
        },
      ]
    : undefined;
};
