// c8 ignore file
import * as typings from "@earnest/application-service-client/typings/codegen.js";

type EmailInput = string

export const inputEmailToDetail = (input?: EmailInput): typings.AddDetailInput['email'] | undefined => {
  return input ? input : undefined;
};
