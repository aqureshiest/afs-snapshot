import ContractType from "./base-contract.js";

class IdentityContract<Identity> extends ContractType<Identity> {
  get contractName(): string {
    return "Identity";
  }
}

export default IdentityContract;
