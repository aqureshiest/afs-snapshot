import type { Plugin as ChassisPlugin } from "@earnest-labs/microservice-chassis/Plugin.js";
import type { default as NeasClient } from "clients/NEAS/index.js";

type NeasClientPlugin = ChassisPlugin<NeasClient<unknown[]>>;

declare module "@earnest-labs/microservice-chassis/PluginContext.js" {
  interface LoadedPlugins {
    NeasClient: NeasClientPlugin;
  }
}
