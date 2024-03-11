export type ApplicationType = "primary-only" | "with-cosigner" | "parent";

export type UserRole = "primary" | "cosigner";

export type BaseEventProperties = {
  product: "SLO";
  product_subtype: ApplicationType;
  initiator: UserRole;
  flowVariation: string;
  role: UserRole;
  "Has no identifying info"?: "true";
};

export type IdentifyingInfoFromRequest = {
  userId?: number;
  anonymousId?: string;
};
