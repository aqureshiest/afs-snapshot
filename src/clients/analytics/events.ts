import {
  ApplicationSectionStartedParams,
  BaseEventProperties,
  EventProps,
} from "./types.js";

const PRODUCT = { product: "SLR" };

export class Event {
  event: string;
  properties: BaseEventProperties;
  anonymousId: string;
  userId: string;

  constructor(props: EventProps) {
    this.event = props.event;
    this.properties = {
      ...PRODUCT,
      ...props.properties,
    };

    if (props.userId) {
      this.userId = props.userId;
    }
  }
}

export class ApplicationSectionStartedEvent extends Event {
  constructor(props: ApplicationSectionStartedParams) {
    super({
      ...props,
      event: "Application Section Started",
    });
  }
}
