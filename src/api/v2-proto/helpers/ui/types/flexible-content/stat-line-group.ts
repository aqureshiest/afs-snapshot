// c8 ignore file
// import {
//   ParagraphProps as NucleusParagraphProps,
//   XResponsiveCSSProps,
// } from "@earnest/nucleus-design-system";

// type _ParagraphProps = Omit<NucleusParagraphProps, "children">;
type _ParagraphProps = Record<string, unknown>;

type ParagraphProps = {
  statProps?: _ParagraphProps;
  labelProps?: _ParagraphProps;
};

type StatLineProps = {
  stat: string;
  label?: string;
  paragraphProps?: ParagraphProps;
  boxProps?: Record<string, unknown>;
};

export type UI_Flexible_StatLineGroup = {
  items: StatLineProps[];
};
