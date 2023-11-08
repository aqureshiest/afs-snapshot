import reviver from "./revivers/reviver.js";
import * as contractTypes from "./contract-types/index.js";

/**
 * Combines the input with a manifest to produce a transformed JSON object
 */
const contractExecutor: ContractExecutor = (
  input,
  manifest,
  contract = manifest["*"],
) => {
  if (Array.isArray(contract)) {
    return contract.map((subContract) =>
      contractExecutor(input, manifest, subContract),
    );
  }

  const revived = JSON.parse(
    contract.definition,
    reviver.bind(null, input, manifest),
  );

  const ContractType = contractTypes[contract.type] || contractTypes.identity;

  const contractInstance = new ContractType(revived, input);

  return contractInstance instanceof contractTypes.MutationType
    ? contractInstance
    : contractInstance.toJSON();
};

const execute: ExecuteContract = (input, manifest, contract) => {
  const executedContract = contractExecutor(input, manifest, contract);

  const mutations: contractTypes.MutationType<unknown, unknown>[] = [];

  JSON.stringify(executedContract, (key, value) => {
    if (value instanceof contractTypes.MutationType) {
      mutations.push(value);
    }
    return value;
  });

  return { contract: executedContract, mutations };
};

export default execute;
