import PluginContext from "@earnest-labs/microservice-chassis/PluginContext.js";

import "clients/client.js";
import { Input as IContractInput } from "contract/contract.js";

declare module "clients/client.js" {
  interface Context {
    logger: PluginContext["logger"];
  }
  type Input = IContractInput;
}
