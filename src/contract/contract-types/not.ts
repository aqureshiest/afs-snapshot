import ContractType from "./base-contract.js";

class NotContract extends ContractType<object | string | number> {
  get contractName(): string {
    return "Not";
  }

  [Symbol.toPrimitive](hint) {
    switch (hint) {
      case "number":
        if (typeof this.definition === "number") {
          return this.definition;
        }
        return this.definition ? 0 : 1;
      case "string":
        if (typeof this.definition === "string") {
          return this.definition;
        }
        return this.definition ? "no" : "yes";
    }
  }

  toJSON() {
    return this.coercion ? this.coercion(!this.definition) : !this.definition;
  }
}

export default NotContract;
