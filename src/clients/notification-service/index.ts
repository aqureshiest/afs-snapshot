import PluginContext from "@earnest-labs/microservice-chassis/PluginContext.js";
import Client from "../client.js";

export default class NotificationServiceClient extends Client {
  get clientName() {
    return "NotificationSerrvice";
  }
  private accessKey: string;
  constructor(accessKey: string, baseUrl: string) {
    const options = { baseUrl };

    super(options);
    this.accessKey = accessKey;
  }
}
