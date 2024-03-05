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

  log(data: unknown, level?: string) {
    if (level && this.logger[level]) {
      this.logger[level](data);
    } else {
      this.logger.info(data);
    }
  }
}
