// c8 ignore file
// import { XResponsiveCSSProps } from "@earnest/nucleus-design-system";
import { UI_Asset } from "../asset.js";



export type UI_HeaderDefinition = {
  copy: string;
  asset?: UI_Asset;
  subCopy?: string;
};

export type UI_Flexible_Header = {
  centered?: boolean;
  marginBottom?: number;
  testId?: string;
  boxProps?: Record<string, unknown>;
} & UI_HeaderDefinition;