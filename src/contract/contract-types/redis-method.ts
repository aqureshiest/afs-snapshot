import assert from "node:assert";
import ContractExecutable from "../contract-executable.js";

class RedisMethod extends ContractExecutable<Definition, Definition, Output> {
  get executionName(): string {
    return "RedisMethod";
  }

  /* eslint-disable-next-line @typescript-eslint/no-unused-vars */
  condition = (_, __, ___, definition: Definition) => {
    if (definition?.key) return true;
    return false;
  };

  /**
   * TODO: use the contracts definition to determine which redis volatile state method
   * to call
   *
   * This function should return the result of the method called
   */
  evaluate = async (
    context: Context,
    executionContext,
    input: Input,
    definition: Definition,
  ) => {
    const redisClient = context.loadedPlugins?.redis?.instance;
    assert(redisClient, "[c2eaa691] redisClient not instantiated");

    if (!definition) return {};

    try {
      return (await redisClient[definition.redisMethod](
        context,
        definition.key,
        definition.value,
      )) as Output;
    } catch (ex) {
      /* ============================== *
       * Redis failures should be reported, but recovered from gracefully
       * ============================== */
      this.log(context, {
        message: `[52d082da] failed ${this.executionName}:\n${ex.message}`,
        error: ex,
      });

      return {};
    }
  };

  // toJSON() {
  //   if (!this.result) return null;
  //   return {
  //     event: this.result?.event,
  //     id: this.result?.id,
  //     createdAt: this.result?.createdAt,
  //   };
  // }
}

export default RedisMethod;
