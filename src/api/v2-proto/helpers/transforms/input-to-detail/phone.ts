// c8 ignore file
import * as typings from "@earnest/application-service-client/typings/codegen.js";

// The UI sends the phone value as a string, convert into a phone detail for application service
export const inputPhoneToDetail = (
  input?: string,
): typings.AddDetailInput["phone"] | undefined => {
  return input ? [{ index: 0, number: input, type: "mobile" }] : undefined;
};
