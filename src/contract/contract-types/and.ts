import ContractType from "./base-contract.js";

class AndContract extends ContractType<Array<object>> {
  get contractName(): string {
    return "And";
  }

  [Symbol.toPrimitive](hint) {
    const { definition } = this;

    const lastTruthy = Array.isArray(definition)
      ? definition.reduce<object | boolean>((a, b) => a && b, true)
      : definition;

    switch (hint) {
      case "number":
        if (typeof lastTruthy === "number") {
          return lastTruthy;
        }
        return lastTruthy ? 1 : 0;
      case "string":
        if (typeof lastTruthy === "string") {
          return lastTruthy;
        }
        return JSON.stringify(lastTruthy);
    }
  }

  toJSON() {
    const { definition } = this;

    const lastTruthy = Array.isArray(definition)
      ? definition.reduce<object | boolean>((a, b) => a && b, true)
      : definition;

    return this.coercion ? this.coercion(lastTruthy) : lastTruthy;
  }
}

export default AndContract;
