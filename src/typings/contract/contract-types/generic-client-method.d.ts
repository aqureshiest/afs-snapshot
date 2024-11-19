import type { Input as IContractInput } from "contract/manifest.js";
import type { PluginContext as ChassisPluginContext } from "@earnest-labs/microservice-chassis/PluginContext.js";
import type { HttpRequest, Client } from "@earnest/http";
import type { IncomingHttpHeaders } from "http";

import "contract/contract-types/generic-client-method.js";
declare module "contract/contract-types/generic-client-method.js" {
  type Input = IContractInput<unknown>;
  type Context = ChassisPluginContext;
  type Definition = {
    client: keyof Context["loadedPlugins"];
    method: HttpRequest.Method;
    action?: string;
    uri: string;
    body?: { [key: string]: unknown };
    query?: { [key: string]: unknown };
    baseUrl: string;
  } & Client.Request;

  type Transformation =
    | null
    | ({
        client: keyof Context["loadedPlugins"];
        action?: string;
        method: HttpRequest.Method;
      } & Client.Request);

  type Output = {
    results?: unknown;
    action?: string;
    error?: Error;
    response?: {
      statusCode: number | undefined;
      statusMessage: string | undefined;
      headers: IncomingHttpHeaders | undefined;
    };
  };
}

import "contract/contract-types/generic-client-method.test.js";
declare module "contract/contract-types/generic-client-method.test.js" {
  type Input<I> = IContractInput<I>;
}
