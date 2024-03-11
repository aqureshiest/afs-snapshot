import { BaseEventProperties, IdentifyingInfoFromRequest } from "./types.js";

export class Event {
  event: string;
  properties: BaseEventProperties;
  request: IdentifyingInfoFromRequest;
  anonymousId: string;
  userId: string;
}
