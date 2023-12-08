import ContractType from "./base-contract.js";

class IdentityContract<Identity> extends ContractType<Identity> {
  get contractName(): string {
    return "Identity";
  }

  toJSON() {
    return this.definition;
  }
}

export default IdentityContract;
