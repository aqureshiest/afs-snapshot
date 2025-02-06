// c8 ignore file
import { UI_Analytics } from "../analytics.js";
import { UI_FlexibleContent } from "./index.js";
import { UI_Flexible_Table } from "./table.js";

export type RatesData = {
  key: string;
  label: string;
  content?: UI_FlexibleContent;
  table: UI_Flexible_Table;
  analytics?: UI_Analytics;
};

export type UI_Flexible_RatesTable = {
  testId?: string;
  data: RatesData[];
  defaultValue?: string;
};
