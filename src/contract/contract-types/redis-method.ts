import assert from "node:assert";
import ContractType from "./base-contract.js";

class RedisMethod extends ContractType<Definition, Definition, Output> {
  get contractName(): string {
    return "RedisMethod";
  }

  /* eslint-disable-next-line @typescript-eslint/no-unused-vars */
  condition = (input: Input, context: Injections, definition: Definition) => {
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
    input: Input,
    injections: Injections,
    definition: Definition,
  ) => {
    const { context } = injections;
    const redisClient = context.loadedPlugins?.redis?.instance;
    assert(redisClient, "[c2eaa691] redisClient not instantiated");
    try {
      return (await redisClient[definition.redisMethod](
        context,
        definition.key,
        definition.value,
      )) as Output;
    } catch (ex) {
      this.error(
        input,
        `[52d082da] failed ${this.contractName}:\n${ex.message}`,
      );
      return {
        method: definition.redisMethod,
        ContractType: this.contractName,
        error: ex.message,
      };
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
