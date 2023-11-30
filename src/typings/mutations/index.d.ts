import type { Plugin as ChassisPlugin } from "@earnest-labs/microservice-chassis/Plugin.js";
import type { PluginContext as ChassisPluginContext } from "@earnest-labs/microservice-chassis/PluginContext.js";
import { SideEffectLayer } from "@earnest/state-machine";
import type { MutationType } from "contract/contract-types/base-contract.js";

type IAssertions = {
  context: ChassisPluginContext;
  mutations: MutationType<unknown, unknown>[];
};

type MutationsPlugin = ChassisPlugin<SideEffectLayer<IAssertions>>;

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
