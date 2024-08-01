import PluginContext from "@earnest-labs/microservice-chassis/PluginContext.js";

import "clients/client.js";
import { IContractInput } from "contract/index.js"; // Replace "path/to/IContractInput" with the actual path to the module containing the IContractInput type.

declare module "clients/client.js" {
  interface Context {
    logger: PluginContext["logger"];
  }
  type Input = IContractInput;
  interface Message {
    error?: Error;
    level?: string;
    message?: string;
    [key: string]: unknown;
  }
}
