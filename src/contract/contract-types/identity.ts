import ContractType from "./base-contract.js";

export default new ContractType<"identity", unknown, unknown>({
  identity: ContractType.identity,
  boolean: Boolean,
});
