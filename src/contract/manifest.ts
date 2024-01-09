import assert from "node:assert";
import { MutationType } from "./contract-types/base-contract.js";

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

  /**
   * Get a manifest from the application context, or return null if that manifest
   * does not exist
   */
  static getManifest(context: Context, path: string[]): Manifest | null {
    const contracts = context.loadedPlugins.contractExecution.instance;
    assert(contracts);

    let manifest: Manifests = contracts.manifests;

    while (path.length) {
      const param = path.shift();

      if (!param || !(param in manifest)) {
        return null;
      }

      manifest = manifest[param];
    }

    return manifest instanceof contracts.Manifest ? manifest : null;
  }

  constructor(context: Context, contracts) {
    this.contracts = contracts;
  }

  traverse(injections: Injections, contract = this.contracts["*"]) {
    if (Array.isArray(contract)) {
      return contract.map((subContract) =>
        this.traverse(injections, subContract),
      );
    }

    return contract.execute(injections);
  }

  /**
   *
   * embedded mutations still pending
   */
  execute(
    context: Context,
    input: Input,
    mutations: Record<string, MutationType<unknown, unknown>> = {},
  ): {
    contract: unknown;
    mutations: Record<string, MutationType<unknown, unknown>>;
  } {
    /* ============================== *
     * The execution reviver is bound to the input and the manifest, allowing
     * contracts to reference substitution keys in the same manifest
     * ============================== */
    const executedContract = this.traverse({
      manifest: this,
      context,
      input,
      executions: [new Map()],
      mutations,
    });

    /* ============================== *
     * Use a JSON replacer to find all instances of MutationType contracts
     * ============================== */

    return { contract: executedContract, mutations };
  }
}
