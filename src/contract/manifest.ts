/**
 * Manifests link independent contract modules together to represent a
 * discrete unit of work for Apply Flow Service to complete, typically either:
 *   1. A representation of application data or some other product JSON
 *   2. A list of mutations that should occur on an application
 */
export default class Manifest {
  contracts: Contracts;
  references: string[];
  name: string;

  constructor(context: Context, manifestName: string, contracts) {
    this.name = manifestName;
    this.contracts = contracts;
  }

  async traverse(
    input: Input,
    injections: Omit<Injections, "contract">,
    contractKey = "*",
    index?: number,
  ) {
    const contract =
      index != null && Array.isArray(this.contracts[contractKey])
        ? this.contracts[contractKey as keyof typeof this.contracts][index]
        : this.contracts[contractKey as keyof typeof this.contracts];

    if (Array.isArray(contract)) {
      return Promise.all(
        contract.map((subContract, i) =>
          this.traverse(input, injections, contractKey, i),
        ),
      );
    }

    const contractInstance = contract.execute(injections, contractKey);

    await contractInstance.execute(input, { ...injections, dependents: {} });

    return contractInstance;
  }

  /**
   *
   * embedded mutations still pending
   */
  async execute(
    input: Input,
    {
      context,
      res,
      evaluations = {},
      ...assertions
    }: Omit<Injections, "manifest" | "contract" | "evaluations"> & {
      evaluations?: Injections["evaluations"];
    },
  ): Promise<{
    contract: unknown;
    evaluations: Injections["evaluations"];
  }> {
    /* ============================== *
     * Manifest execution includes
     * contracts to reference substitution keys in the same manifest
     * ============================== */

    const contract = await this.traverse(input, {
      manifest: this,
      context,
      res,
      evaluations,
      ...assertions,
    });

    return { contract, evaluations };
  }
}
