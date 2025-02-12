import type { Input as IContractInput } from "contract/manifest.js";
import type { PluginContext as ChassisPluginContext } from "@earnest-labs/microservice-chassis/PluginContext.js";
import type { HttpRequest, Client } from "@earnest/http";
import type { IncomingHttpHeaders } from "http";

import "contract/contract-types/client-method.js";
declare module "contract/contract-types/client-method.js" {
  type Input = IContractInput;
  type Context = ChassisPluginContext;
  type Definition = {
    client: keyof Context["loadedPlugins"];
    method: HttpRequest.Method;
    action?: string;
    /**
     * If true the evaluation will self-report an error with the response body
     * if the response status code is not between 200 and 399 (inclusive)
     */
    required?: boolean;
  } & Client.Request;

  type Transformation =
    | null
    | ({
        client: keyof Context["loadedPlugins"];
        action?: string;
        method: HttpRequest.Method;
      } & Client.Request);

  type Output = {
    results: unknown;
    action?: string;
    error?: Error;
    response?: {
      statusCode: number | undefined;
      statusMessage: string | undefined;
      headers: IncomingHttpHeaders | undefined;
    };
  };
}

import "contract/contract-types/client-method.test.js";
declare module "contract/contract-types/client-method.test.js" {
  type Input<I> = IContractInput;
}
