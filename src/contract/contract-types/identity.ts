import ContractType from "./base-contract.js";

class IdentityContract<Identity> extends ContractType<Identity> {
  get contractName(): string {
    return "Identity";
  }

  toJSON() {
    if (this.coercion) {
      const coercion = this.coercion(this.definition);
      return coercion;
    }
    return this.definition;
  }
}

export default IdentityContract;
