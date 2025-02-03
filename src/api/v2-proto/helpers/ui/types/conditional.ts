// c8 ignore file
export type OperatorItem<O = "", Opt = Record<string, unknown>> = {
  op: O;
  leftOperand: unknown;
  rightOperand?: unknown;
  options?: Opt;
};

export type YearsFromNowOptions = { diffOp: UI_Operators["op"] };

export type UI_Operators =
  | OperatorItem<"gt">
  | OperatorItem<"gte">
  | OperatorItem<"lt">
  | OperatorItem<"lte">
  | OperatorItem<"eq">
  | OperatorItem<"!eq">
  | OperatorItem<"valueEquals">
  | OperatorItem<"hasValue">
  | OperatorItem<"oneOf">
  | OperatorItem<"!oneOf">
  | OperatorItem<"yearsFromNow", YearsFromNowOptions>;

export type UI_Conditional =
  | string
  | {
      field: string;
      op: UI_Operators["op"];
      value?: unknown;
      options?: UI_Operators["options"];
    };

export type UI_AndPredicate = Array<UI_Conditional>;
export type UI_Predicate = Array<UI_AndPredicate>;