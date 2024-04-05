import { Client } from "@earnest/http";
import PluginContext from "@earnest-labs/microservice-chassis/PluginContext.js";

export default class BaseClient<
  Injections extends unknown[],
> extends Client<Injections> {
  private logger: PluginContext["logger"];

  constructor(
    options: Client.Options & { accessKey: string },
    context: PluginContext,
  ) {
    super(options);

    if (context.logger != null) {
      this.logger = context.logger;
    }
  }

  log(message: { error?: Error, [key: string]: unknown}, ...injections: Injections) {
    if (message && message?.error) {
      this.logger.error(message);
    } else {
      this.logger.info(message);
    }
  }
}
