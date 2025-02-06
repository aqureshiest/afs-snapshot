// c8 ignore file
import * as typings from "@earnest/application-service-client/typings/codegen.js";

type NameInput = {
  first: string;
  last: string;
};

export const inputNameToDetail = (
  input?: NameInput,
): typings.AddDetailInput["name"] | undefined => {
  return input ? input : undefined;
};
