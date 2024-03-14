import {
  ApplicationSectionStartedTrackParams,
  EventProps,
  TrackEventProps,
  IdentifyEventProps,
} from "./types.js";

const PRODUCT = { product: "SLR" };

export class Event {
  anonymousId: string;
  userId?: string;
  timestamp?: Date;
  context?: { [key: string]: string };

  constructor(props: EventProps) {
    this.anonymousId = props.anonymousId;
    if (props.userId) {
      this.userId = props.userId;
    }

    if (props.context) {
      this.context = props.context;
    }

    if (props.timestamp) {
      this.timestamp = props.timestamp;
    }
  }
}

export class IdentifyEvent extends Event {
  traits: { [key: string]: string };

  constructor(props: IdentifyEventProps) {
    super(props);

    this.traits = {
      ...PRODUCT,
      ...props.traits,
    };
  }
}

export class TrackEvent extends Event {
  event: string;
  properties: { [key: string]: string };

  constructor(props: TrackEventProps) {
    super(props);
    this.event = props.event;
    this.properties = {
      ...PRODUCT,
      ...props.properties,
    };
  }
}

export class ApplicationSectionStartedTrackEvent extends TrackEvent {
  constructor(props: ApplicationSectionStartedTrackParams) {
    super({
      ...props,
      event: "Application Section Started",
    });
  }
}
