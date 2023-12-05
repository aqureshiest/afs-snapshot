import assert from "node:assert";
import { MutationType } from "./contract-types/base-contract.js";

import reviver from "./revivers/reviver.js";
import Reference from "./reference.js";

/**
 * Manifests link independent contract modules together to represent a
 * discrete unit of work for Apply Flow Service to complete, typically either:
 *   1. A representation of application data or some other product JSON
 *   2. A list of mutations that should occur on an application
 */
export default class Manifest {
  contracts: Contracts;
  references: string[];

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
      assert(param);

      if (!(param in manifest)) {
        return null;
      }

      manifest = manifest[param];
    }

    return manifest instanceof contracts.Manifest ? manifest : null;
  }

  constructor(contracts) {
    this.contracts = contracts;
    this.references = this.getReferences();
  }

  /**
   * Recursively execute a contract on the manifest using a provided reviver
   */
  traverse(
    boundReviver: Parameters<typeof JSON.parse>[1],
    input?: Input,
    contract = this.contracts["*"],
  ) {
    if (Array.isArray(contract)) {
      return contract.map((subContract) =>
        this.traverse(boundReviver, input, subContract),
      );
    }

    return contract.execute(boundReviver, input);
  }

  getReferences(): string[] {
    /* ============================== *
     * Reviver is bound without inputs so it can gather meta-details about
     * the contract such as the inputs that will be required
     * ============================== */
    const boundReviver = reviver.bind(null, null, this);
    const executedContract = this.traverse(boundReviver);
    const references: Set<string> = new Set();

    JSON.stringify(executedContract, (key, value) => {
      if (value instanceof Reference) {
        references.add(value.key);
      }
      return value;
    });

    return Array.from(references);
  }

  /**
   *
   * embedded mutations still pending
   */
  execute(input: Input): {
    contract: unknown;
    mutations: MutationType<unknown, unknown>[];
  } {
    /* ============================== *
     * The execution reviver is bound to the input and the manifest, allowing
     * contracts to reference substitution keys in the same manifest
     * ============================== */
    const boundReviver = reviver.bind(null, input, this);
    const executedContract = this.traverse(boundReviver, input);
    const mutations: MutationType<unknown, unknown>[] = [];

    JSON.stringify(executedContract, (key, value) => {
      if (value instanceof MutationType) {
        mutations.push(value);
      }
      return value;
    });

    return { contract: executedContract, mutations };
  }
}
