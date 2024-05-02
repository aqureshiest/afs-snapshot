import type { Client as BaseClient } from "@earnest/http";
import Client from "../client.js";

export default class extends Client {
  get clientName() {
    return "ApplicationService";
  }
  constructor(options: BaseClient.Options & { accessKey: string }) {
    super(options);
  }
}
