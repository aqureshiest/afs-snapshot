export type ApplicationType = "primary-only" | "with-cosigner" | "parent";

export type UserRole = "primary" | "cosigner";

export type EventProps = {
  userId?: string;
  anonymousId: string;
  timestamp?: Date;
  context?: { [key: string]: string };
};

export type IdentifyEventProps = EventProps & {
  traits: BaseTrackEventProperties;
};

export type TrackEventProps = EventProps & {
  event: string;
  properties: BaseTrackEventProperties;
};

export type BaseTrackEventProperties = {
  product: "SLR";
  product_subtype: ApplicationType;
  initiator: UserRole;
  flowVariation: string;
  role: UserRole;
  section: string;
  "Has no identifying info"?: "true";
};

export type ApplicationSectionStartedTrackParams = TrackEventProps & {
  properties: {
    section: string;
  };
};
