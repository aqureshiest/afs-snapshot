import ContractExecutable from "../contract-executable.js";

class IdentityContract<Identity> extends ContractExecutable<Identity> {
  get executionName(): string {
    return "Identity";
  }
}

export default IdentityContract;
