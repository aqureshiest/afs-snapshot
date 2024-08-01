import type { Input as IContractInput } from "contract/manifest.js";
import type { PluginContext as ChassisPluginContext } from "@earnest-labs/microservice-chassis/PluginContext.js";
import type { HttpRequest, Client } from "@earnest/http";

import type { Injections as IExecutionInjections } from "contract/contract-types/base-contract.js";

import "contract/contract-types/client-method.js";
declare module "contract/contract-types/client-method.js" {
  type Input = IContractInput;
  type Context = ChassisPluginContext;
  type Definition = {
    client: keyof Context["loadedPlugins"];
    method: HttpRequest.Method;
  } & Client.Request;

  type Transformation =
    | null
    | ({
        client: keyof Context["loadedPlugins"];
        method: HttpRequest.Method;
      } & Client.Request);

  type Injections = IExecutionInjections;

  type Output = { statusCode: number | null; message: string } | unknown;
}

import "contract/contract-types/client-method.test.js";
declare module "contract/contract-types/client-method.test.js" {
  type Input = IContractInput;
}
