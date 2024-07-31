import * as fs from "node:fs/promises";
import * as path from "node:path";
import assert from "node:assert";

import Manifest from "./manifest.js";
import Contract from "./contract.js";
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
  extension: RegExp,
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
            extension,
            fn,
            [...pathSegments, subPath],
            accumulator,
          );
        } else if (stat.isFile() && extension.test(subPath)) {
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
  return recursiveDo<Contracts<unknown>>(
    context,
    path,
    constants.HANDLEBARS_FILE_REGEX,
    async function (rootPath, pathSegments, contracts) {
      assert(contracts);
      assert(pathSegments);

      /* ============================== *
       * TODO (1/?): file validation / error handling
       * ============================== */

      const fileName = pathSegments.pop();
      assert(fileName);
      const fileKey = fileName.replace(constants.HANDLEBARS_FILE_REGEX, "");
      pathSegments.splice(1, 0, fileKey);
      const contractKey = pathSegments.pop();
      const contractType = pathSegments.shift() || DEFAULT_TYPE;
      const contractVersion = pathSegments.shift() || DEFAULT_VERSION;
      assert(contractKey);
      const file = await fs.readFile(rootPath, "utf8");

      /* ============================== *
       * I. Parse the contract definition to ensure executability
       * II. Use revivers to record which substitutions are associated
       *     with each contract module
       * ============================== */

      const contract = new Contract({
        key: contractKey,
        folders: pathSegments,
        version: contractVersion,
        type: contractType as ContractType,
        raw: file,
      });

      if (!(contract.name in contracts)) {
        contracts[contract.name] = {};
      }

      contracts[contract.name][contractVersion] = contract;
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
  const schema = context.loadedPlugins.schema.instance;
  assert(schema, "[22eda02b] Schema not instantiated");
  let totalManifests = 0;
  const manifests = await recursiveDo<Manifests>(
    context,
    path,
    constants.JSON_FILE_REGEX,
    async function (rootPath, pathSegments, manifests) {
      assert(manifests);
      assert(pathSegments);
      /* ============================== *
       * TODO (2/?): file validation / error handling
       * ============================== */

      const fileName = pathSegments.pop();
      assert(fileName);

      const fileKey = fileName.replace(constants.JSON_FILE_REGEX, "");
      const manifestName = `${pathSegments.join("/")}${
        pathSegments.length > 0 ? "/" : ""
      }${fileKey}`;

      const file = await fs.readFile(rootPath, "utf8");

      let parsed: ManifestContracts | ManifestJson[] = JSON.parse(file);

      /**
       * TODO: this is a temporary compatibility measure
       */
      if ("*" in parsed) {
        parsed = [
          {
            methods: Manifest.DEFAULT_METHODS,
            parameters: Manifest.DEFAULT_PARAMETERS,
            inputs: Manifest.DEFAULT_INPUTS,
            outputs: parsed,
          },
        ];
      }

      const manifestDefinition = (manifests[manifestName] = {} as ReturnType<
        (typeof Manifest)["getDefinitionForMethods"]
      >);

      const methodDefinitions = Manifest.getDefinitionForMethods(
        parsed as ManifestJson[],
      );

      Object.keys(methodDefinitions).forEach(
        (method: keyof typeof methodDefinitions) => {
          const methodDefinition = methodDefinitions[method];

          schema.validate(constants.manifestSchema, methodDefinition);

          if (schema.errors) {
            context.logger.warn({
              message: "Manifest failed schema validation",
              manifest: {
                name: manifestName,
                method,
              },
              errors: schema.errors,
            });
          } else {
            manifestDefinition[method] = methodDefinition;
          }
        },
      );

      totalManifests++;
      return manifests;
    },
  );

  return { totalManifests, manifests };
};

/**
 * Recursively scan through the manifests directories and produce a nested
 * hierarchy of manifests with parsed contracts
 */
export const buildSchemas: BuildSchemas = async function buildSchemas(
  context,
  path,
) {
  let totalSchemas = 0;
  const schemasBuild = await recursiveDo<Schemas>(
    context,
    path,
    constants.SCHEMA_FILE_REGEX,
    async function (rootPath, pathSegments, schemas) {
      assert(schemas);
      assert(pathSegments);
      /* ============================== *
       * TODO (2/?): file validation / error handling
       * ============================== */

      const fileName = pathSegments.pop();
      assert(fileName);
      pathSegments.shift();
      const schemaName = `${pathSegments.join("/")}`;
      const cursor: Schemas = schemas;

      const file = await fs.readFile(rootPath, "utf8");

      const parsed = JSON.parse(file);
      parsed["$id"] = schemaName;
      cursor[schemaName] = parsed;

      totalSchemas++;
      return schemas;
    },
  );

  return { totalSchemas, schemas: schemasBuild };
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
