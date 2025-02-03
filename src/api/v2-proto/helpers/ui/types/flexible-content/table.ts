// c8 ignore file
export type UI_Flexible_Table = {
  testId?: string;
  headers: string[];
  rows: string[][];
  footer?: string;
  metadata?: {
    centered?: boolean;
    stylePreset?:
      | "basic"
      | "basicNoBG"
      | "lastColumnGreen"
      | "lastColumnBGGray"
      | "lastColumnGreenBGGreen"
      | "lastColumnGreenBGGray";
  };
}