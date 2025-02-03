// c8 ignore file
import { UI_Asset } from "../asset.js";

type ListItems = Array<{
  copy: string;
  icon?: UI_Asset;
}>;

type ListDefinition = {
  type?: "ol" | "ul";
  defaultIcon?: UI_Asset;
  items: ListItems;
  variant?: "default" | "stepper";
  label?: string;
  className?: string;
};

export type UI_Flexible_List = {
  testId?: string;
} & ListDefinition;
