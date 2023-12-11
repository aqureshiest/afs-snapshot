import type { Plugin as ChassisPlugin } from "@earnest-labs/microservice-chassis/Plugin.js";
import type { PluginContext as ChassisPluginContext } from "@earnest-labs/microservice-chassis/PluginContext.js";
import type { MutationType } from "contract/contract-types/base-contract.js";
import type { default as Machine } from "mutations/machine.js";
import type { Input } from "contract/contract.js";
import type { default as Manifest } from "contract/manifest.js";

type IAssertions = {
  context: ChassisPluginContext;
  mutations: Record<string, MutationType<unknown, unknown>>;
  manifest: Manifest;
  contract: unknown;
  input: Input;
  asOf?: Date;
};

type IState = {
  asOf?: Date;
};

type MutationsPlugin = ChassisPlugin<typeof Machine>;

declare module "@earnest-labs/microservice-chassis/PluginContext.js" {
  interface LoadedPlugins {
    mutations: MutationsPlugin;
  }
}

import "mutations/chassis-plugin.js";
declare module "mutations/chassis-plugin.js" {
  type Plugin = MutationsPlugin;
  type Context = ChassisPluginContext;
}

import "mutations/machine.js";
declare module "mutations/machine.js" {
  type Assertions = IAssertions;
  type State = IState;
}

import "mutations/effects/execute.js";
declare module "mutations/effects/execute.js" {
  type Assertions = IAssertions;
  type State = IState;
  type Mutation = MutationType<unknown, unknown>;
}

import "mutations/effects/application-event.js";
declare module "mutations/effects/application-event.js" {
  type Assertions = IAssertions;
  type Mutation = MutationType<unknown, unknown>;
}

import "mutations/effects/create-application.js";
declare module "mutations/effects/create-application.js" {
  type Assertions = IAssertions;
}

import "mutations/effects/update-application-details.js";
declare module "mutations/effects/update-application-details.js" {
  type Assertions = IAssertions;
}

import "mutations/effects/add-reference.js";
declare module "mutations/effects/add-reference.js" {
  type Assertions = IAssertions;
}
