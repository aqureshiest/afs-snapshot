import PluginContext from "@earnest-labs/microservice-chassis/PluginContext.js";

import "clients/client.js";
declare module "clients/client.js" {
  interface Context {
    logger: PluginContext["logger"];
  }

  interface Message {
    error?: Error;
    level?: string;
    message?: string;
    [key: string]: unknown;
  }
}
