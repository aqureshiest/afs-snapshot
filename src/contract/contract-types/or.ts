import ContractType from "./base-contract.js";

class OrContract extends ContractType<Array<object>> {
  get contractName(): string {
    return "Or";
  }

  [Symbol.toPrimitive](hint) {
    const { definition } = this;

    const firstTruthy = Array.isArray(definition)
      ? definition.find((sub) => !!+sub) || null
      : definition;

    switch (hint) {
      case "number":
        if (typeof firstTruthy === "number") {
          return firstTruthy;
        }
        return firstTruthy ? 1 : 0;
      case "string":
        if (typeof firstTruthy === "string") {
          return firstTruthy;
        }
        return JSON.stringify(firstTruthy);
    }
  }

  toJSON() {
    const { definition } = this;

    const firstTruthy = Array.isArray(definition)
      ? definition.find(Boolean) || null
      : definition;

    return this.coercion ? this.coercion(firstTruthy) : firstTruthy;
  }
}

export default OrContract;
