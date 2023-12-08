import type { PluginContext } from "@earnest-labs/microservice-chassis/PluginContext.js";

import "contract/ingestor.js";
declare module "contract/ingestor.js" {
  interface FileTraverser<A extends { [key: string]: unknown }> {
    (rootPath: string, pathSegments: string[], accumulator: A): Promise<A>;
  }

  interface DirectoryTraverser {
    <A extends { [key: string]: unknown }>(
      context: PluginContext,
      rootPath: string,
      extension: RegExp,
      fileTraverser: FileTraverser<A>,
      pathSegments?: string[],
      accumulator?: A,
    ): Promise<A>;
  }

  /* ============================== *
   * TODO: replace the types below
   * ============================== */
}
