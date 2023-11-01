import * as fs from "node:fs/promises";
import * as path from "node:path";
import assert from "node:assert";

import * as constants from "./constants.js";

const MANIFESTS_PATH = path.join("flows", "manifests");
const CONTRACTS_PATH = path.join("flows", "contracts");
const DEFAULT_VERSION = "default";
const DEFAULT_TYPE = "identity";

/**
 * Recursively scans a directory structure and performs some action on all files
 * inside. The provided function will receive the full path and an accumulator
 */
const recursiveDo: DirectoryTraverser = async function recursiveDo<
  A extends { [key: string]: unknown },
>(
  context,
  rootPath: string,
  fn: FileTraverser<A>,
  pathSegments: string[] = [],
  accumulator = {} as A,
) {
  const dir = await fs.readdir(rootPath);

  await Promise.all(
    dir.map(async (subPath) => {
      const currentPath = path.join(rootPath, subPath);
      try {
        const stat = await fs.lstat(currentPath);

        if (stat.isDirectory()) {
          await recursiveDo(
            context,
            currentPath,
            fn,
            [...pathSegments, subPath],
            accumulator,
          );
        } else if (stat.isFile() && constants.JSON_FILE_REGEX.test(subPath)) {
          await fn(currentPath, [...pathSegments, subPath], accumulator);
        }
      } catch (error) {
        context?.logger.error({
          message: "File processing failure",
          path: currentPath,
          error: {
            message: error.message,
            stack: error.stack,
          },
        });
      }
    }),
  );

  return accumulator;
};

/**
 * Recursively traverse all the contract files to create a flattened list
 */
export const buildContracts: BuildContracts = async function buildContracts(
  context,
  path: string,
) {
  return recursiveDo<Contracts>(
    context,
    path,
    async function (rootPath, pathSegments, contracts) {
      assert(contracts);
      assert(pathSegments);

      /* ============================== *
       * TODO (1/?): file validation / error handling
       * ============================== */

      const fileName = pathSegments.pop();
      assert(fileName);
      const fileKey = fileName.replace(constants.JSON_FILE_REGEX, "");

      pathSegments.splice(1, 0, fileKey);

      const contractKey = pathSegments.pop();
      const contractType = pathSegments.shift() || DEFAULT_TYPE;
      const contractVersion = pathSegments.shift() || DEFAULT_VERSION;

      assert(contractKey);

      const file = await fs.readFile(rootPath, "utf8");

      JSON.parse(file); // Parse the contract definition to ensure executability

      if (!(contractKey in contracts)) {
        contracts[contractKey] = {};
      }

      contracts[contractKey][contractVersion] = {
        type: contractType,
        definition: file,
      };

      return contracts;
    },
  );
};

/**
 * Recursively scan through the manifests directories and produce a nested
 * hierarchy of manifests with parsed contracts
 */
export const buildManifests: BuildManifests = async function buildManifests(
  context,
  path,
  contracts,
) {
  let totalManifests = 0;
  const manifests = await recursiveDo<Manifests>(
    context,
    path,
    async function (rootPath, pathSegments, manifests) {
      assert(manifests);
      assert(pathSegments);

      /* ============================== *
       * TODO (2/?): file validation / error handling
       * ============================== */

      const fileName = pathSegments.pop();
      assert(fileName);
      const fileKey = fileName.replace(/\.json$/, "");

      let cursor: Manifest | Manifests = manifests;

      while (pathSegments.length) {
        const segment = pathSegments.shift();
        assert(segment);

        if (!(segment in cursor)) {
          cursor[segment] = {};
        }

        const cursorSegment = cursor[segment];

        if (cursorSegment && typeof cursorSegment === "object") {
          cursor = cursorSegment;
        }
      }

      const file = await fs.readFile(rootPath, "utf8");

      const parsed = JSON.parse(file);

      for (const mappingKey in parsed) {
        const getContract = (contractKey) => {
          const [, key, version = DEFAULT_VERSION] =
            /^([^.]+)(?:\.(.+))?$/.exec(contractKey) || [];

          const contract = contracts?.[key]?.[version];

          if (!contract) {
            const error = new Error(
              "Manifest referenced a non-existent or invalid contract",
            );
            context?.logger.error({
              message: error.message,
              manifest: {
                key: fileKey,
                contractKey: mappingKey,
              },
              contract: {
                key,
                version,
              },
            });

            throw error;
          }

          return contract;
        };

        parsed[mappingKey] = Array.isArray(parsed[mappingKey])
          ? parsed[mappingKey].map((subKey) => getContract(subKey))
          : getContract(parsed[mappingKey]);
      }

      cursor[fileKey] = parsed;

      totalManifests++;

      return manifests;
    },
  );

  return { totalManifests, manifests };
};

const ingestManifests: IngestManifest = async function ingestManifests(
  context,
) {
  const t0 = Date.now();
  const contracts = await buildContracts(context, CONTRACTS_PATH);
  const t1 = Date.now();
  const { manifests, totalManifests } = await buildManifests(
    context,
    MANIFESTS_PATH,
    contracts,
  );
  const t2 = Date.now();

  const totalContracts = Object.keys(contracts).length;

  context?.logger.info({
    message: "Contracts loaded successfully",
    manifests: {
      total: totalManifests,
      elapsed: t2 - t1,
    },
    contracts: {
      total: totalContracts,
      elapsed: t1 - t0,
    },
    elapsed: t2 - t0,
  });

  return { contracts, manifests };
};

export default ingestManifests;
