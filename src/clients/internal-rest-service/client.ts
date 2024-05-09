import type { Client as IClient } from "@earnest/http";
import Client from "../client.js";

export class InternalRestServiceClient extends Client {
  get clientName() {
    return "InternalRestServiceClient";
  }
  readonly authKey: string;

  constructor({ authKey, ...options }: IClient.Options & { authKey: string }) {
    super(options);
    Object.defineProperty(this, "authKey", {
      value: Buffer.from(authKey + ":", "utf8").toString("base64"),
      enumerable: false,
    });

    const defaultHeaders = this.headers;

    Object.defineProperty(this, "headers", {
      get() {
        return {
          ...defaultHeaders,
          Authorization: `Basic ${this.authKey}`,
        };
      },
    });
  }
}

export default InternalRestServiceClient;
