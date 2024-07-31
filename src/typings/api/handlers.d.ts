import type { PluginContext } from "@earnest-labs/microservice-chassis/PluginContext.js";
import type { BoundHandler } from "api/wrap-async-handler.js";
import { ErrorRequestHandler } from "express";
import type { HttpError as IHttpError } from "http-errors";
import type IManifest from "contract/manifest.js";

import "api/handlers/get-manifest.js";
declare module "api/handlers/get-manifest.js" {
  type Handler = BoundHandler;
}

import "api/handlers/get-inputs.js";
declare module "api/handlers/get-inputs.js" {
  type Handler = BoundHandler;

  type Manifests = NonNullable<
    PluginContext["loadedPlugins"]["contractExecution"]["instance"]
  >["manifests"];
}

import "api/handlers/execute.js";
declare module "api/handlers/execute.js" {
  type Handler = BoundHandler;
}

import "api/handlers/execution-errors.js";
declare module "api/handlers/execution-errors.js" {
  type Handler = BoundHandler;
}

import "api/handlers/not-found.js";
declare module "api/handlers/not-found.js" {
  type Handler = BoundHandler;

  type Manifests = NonNullable<
    PluginContext["loadedPlugins"]["contractExecution"]["instance"]
  >["manifests"];
}

import "api/handlers/error.js";
declare module "api/handlers/error.js" {
  type Handler = (
    context: PluginContext,
    ...resolverArgs: Parameters<ErrorRequestHandler>
  ) => ReturnType<ErrorRequestHandler>;
}

import "api/handlers/representation-error.js";
declare module "api/handlers/representation-error.js" {
  type Handler = (
    context: PluginContext,
    ...resolverArgs: Parameters<ErrorRequestHandler>
  ) => ReturnType<ErrorRequestHandler>;
  type Context = PluginContext;
  type Manifest = IManifest<unknown>;
  type Manifests = NonNullable<
    PluginContext["loadedPlugins"]["contractExecution"]["instance"]
  >["manifests"];
}

import "api/handlers/mutation-error.js";
declare module "api/handlers/mutation-error.js" {
  type Handler = (
    context: PluginContext,
    ...resolverArgs: Parameters<ErrorRequestHandler>
  ) => ReturnType<ErrorRequestHandler>;
}
