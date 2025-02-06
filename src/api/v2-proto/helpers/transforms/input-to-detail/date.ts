// c8 ignore file
import * as typings from "@earnest/application-service-client/typings/codegen.js";
import { dateTransforms } from "../date.js";

type DateInput = {
  month: number;
  day: number;
  year: number;
};

// I hate that we rely on DOB type for basic dates, but it's what we have right now
export const inputDateToDetail = (
  input?: DateInput,
): typings.AddDetailInput["dateOfBirth"] | undefined => {
  return input ? dateTransforms.objToString(input) : undefined;
};
