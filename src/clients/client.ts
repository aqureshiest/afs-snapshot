import { Client as BaseClient, mixins } from "@earnest/http";
import { Daemon } from "@earnest/timing";

class Client extends BaseClient<[Context | void]> {
  private healthDaemon?: Daemon<Context>;
  private healthChecks: number[] = [];
  private healthThreshold: number = 90;

  get clientName() {
    return "Client";
  }

  get headers() {
    return {
      ...super.headers,
      "Content-Type": "application/json",
      Accept: "application/json",
    };
  }

  public get health() {
    const totalHealth = this.healthChecks.reduce((a, b) => a + b, 0);
    const adjustedHealth = this.healthChecks.map((n, i) => {
      return (
        ((this.healthChecks.length - i) / this.healthChecks.length) *
        totalHealth *
        n
      );
    });

    const health = Math.floor(
      (100 * adjustedHealth.reduce((a, b) => a + (b ? 1 : 0), 0)) /
        adjustedHealth.length,
    );

    return health;
  }

  public get isHealthy() {
    return this.health >= this.healthThreshold;
  }

  private logLevelFromMessage(message: LogMessage): string {
    if (message.level) return message.level;
    if ("error" in message) return "error";
    if (
      (typeof message.statusCode === "number" && message.statusCode >= 500) ||
      message.statusCode === null
    )
      return "error";
    if (typeof message.statusCode === "number" && message.statusCode >= 400)
      return "warn";

    return "info";
  }

  public stream<T>(method, options, context) {
    const request = super.stream<T>(method, options, context);

    request.once("response", (res) => {
      const isErrorResponse = !res.statusCode || res.statusCode >= 500;
      this.healthChecks.unshift(isErrorResponse ? 0 : 1);
      this.healthChecks.splice(100);
    });

    request.once("error", () => {
      this.healthChecks.unshift(0);
      this.healthChecks.splice(100);
    });

    return request;
  }

  async start(context: Context) {
    await super.start(context);

    this.healthDaemon = new Daemon(
      async (c) => {
        const { response } = await this.get({ uri: "/ping" }).catch(() => ({
          response: { statusCode: null },
        }));

        if (!response.statusCode || response.statusCode >= 400) {
          this.log(
            {
              level: "error",
              message: "Client failed health check",
              statusCode: response.statusCode,
              health: this.health,
            },
            c,
          );
        }
      },
      { interval: 1000 * 60 },
    );

    await this.healthDaemon.start(context);

    this.log({ level: "debug", message: "Client initialized" }, context);
  }

  async stop() {
    await this.healthDaemon?.stop();
    delete this.healthDaemon;
    await super.stop();
  }

  log(message: LogMessage, context?: Context) {
    const level = this.logLevelFromMessage(message);
    const { error } = message;
    const decoratedMessage = {
      message: this.clientName,
      error: error ? error.message : undefined,
      stack: error ? error.stack : undefined,
      ...message,
      client: this.clientName,
    };
    context?.logger?.log(level, decoratedMessage);
  }
}

export default mixins.agent({ keepAlive: false })(mixins.logged(Client));
