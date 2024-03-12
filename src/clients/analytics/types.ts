export type ApplicationType = "primary-only" | "with-cosigner" | "parent";

export type UserRole = "primary" | "cosigner";

export type EventProps = {
  event: string;
  userId?: string;
  anonymousId: string;
  properties: BaseEventProperties;
};

export type BaseEventProperties = {
  product: "SLR";
  product_subtype: ApplicationType;
  initiator: UserRole;
  flowVariation: string;
  role: UserRole;
  section: string;
  "Has no identifying info"?: "true";
};

export type BaseEventParameters = EventProps;

export type ApplicationSectionStartedParams = BaseEventParameters & {
  properties: {
    section: string;
  };
};
