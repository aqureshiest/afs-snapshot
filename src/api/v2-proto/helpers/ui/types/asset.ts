// c8 ignore file
// import { IconProps } from "@earnest/nucleus-design-system";

// TODO: This is a placeholder until we fix Nucleus props
type ReplaceWithIconProps = string;

export enum Assets {
  LocalAsset = "LocalAsset",
  NucleusIcon = "NucleusIcon",
}

type LocalAsset = {
  type: "LocalAsset"
  name: string;
  width?: number;
  height?: number;
  testId?: string;
  center?: boolean;
};

type NucleusIcon = {
  type: "NucleusIcon"
  center?: boolean;
} & ReplaceWithIconProps;

export type UI_Asset = LocalAsset | NucleusIcon;
