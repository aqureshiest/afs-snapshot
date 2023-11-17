import type { PluginContext } from "@earnest-labs/microservice-chassis/PluginContext.js";
import type { BoundHandler } from "api/wrap-async-handler.js";
import { ErrorRequestHandler } from "express";

import "api/handlers/get-inputs.js";
declare module "api/handlers/get-inputs.js" {
  type Handler = BoundHandler;

  type Manifests = NonNullable<
    PluginContext["loadedPlugins"]["contractExecution"]["instance"]
  >["manifests"];
}

import "api/handlers/execute-contract.js";
declare module "api/handlers/execute-contract.js" {
  type Handler = BoundHandler;

  type Manifests = NonNullable<
    PluginContext["loadedPlugins"]["contractExecution"]["instance"]
  >["manifests"];
}

import "api/handlers/get.js";
declare module "api/handlers/get.js" {
  type Handler = BoundHandler;

  type Manifests = NonNullable<
    PluginContext["loadedPlugins"]["contractExecution"]["instance"]
  >["manifests"];
}

import "api/handlers/post.js";
declare module "api/handlers/post.js" {
  type Handler = BoundHandler;
}

import "api/handlers/error.js";
declare module "api/handlers/error.js" {
  type Handler = (
    context: PluginContext,
    ...resolverArgs: Parameters<ErrorRequestHandler>
  ) => ReturnType<ErrorRequestHandler>;
}
