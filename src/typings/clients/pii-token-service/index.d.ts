import type { Plugin as ChassisPlugin } from "@earnest-labs/microservice-chassis/Plugin.js";
import PiiTokenServiceClient from "clients/pii-token-service/index.js";
type PiiTokenServicePlugin = ChassisPlugin<PiiTokenServiceClient>;

declare module "@earnest-labs/microservice-chassis/PluginContext.js" {
  interface LoadedPlugins {
    piiTokenServiceClient: PiiTokenServicePlugin;
  }
}
