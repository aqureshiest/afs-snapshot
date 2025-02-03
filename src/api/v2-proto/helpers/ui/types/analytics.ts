// c8 ignore file
import { UI_Predicate } from "./conditional.js";

export type UI_Analytics =
  | ({
      formValues?: {
        key: string;
        path?: string;
        value?: string;
      }[];
      conditional?: UI_Predicate;
      serverProperties?: Record<string, unknown>;
      name?: string;
    } & Record<string, unknown>)
  | null;