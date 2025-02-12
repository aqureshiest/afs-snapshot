import type { Plugin as ChassisPlugin } from "@earnest-labs/microservice-chassis/Plugin.js";
import type { PluginContext as ChassisPluginContext } from "@earnest-labs/microservice-chassis/PluginContext.js";
import { RequestHandler } from "express";

import "api/wrap-async-handler.js";
declare module "api/wrap-async-handler.js" {
  type Context = ChassisPluginContext;
  type BoundHandler = (
    context: ChassisPluginContext,
    ...resolverArgs: Parameters<RequestHandler>
  ) => ReturnType<RequestHandler>;

  type Handler = RequestHandler;
}

import "api/chassis-plugin.js";
declare module "api/chassis-plugin.js" {
  type Plugin = ChassisPlugin<void>;
  type Context = ChassisPluginContext;
}

import "api/chassis-plugin.test.js";
declare module "api/chassis-plugin.test.js" {
  type Plugin = ChassisPlugin<void>;
  type Context = ChassisPluginContext;
}
