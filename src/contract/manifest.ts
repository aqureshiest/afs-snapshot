import assert from "node:assert";
import * as constants from "./constants.js";
import ManifestExecution from "./manifest-execution.js";
import Contract from "./contract.js";
/**
 * Manifests link independent contract modules together to represent a
 * discrete unit of work for Apply Flow Service to complete, typically either:
 *   1. A representation of application data or some other product JSON
 *   2. A list of mutations that should occur on an application
 */
export default class Manifest<I> implements ExecutableParent<I> {
  id: string;

  contractKeys: ManifestContracts;
  contracts: Contracts<I>;
  executables: Executables<I>;
  references: string[];

  /**
   * This describes the default methods supported by legacy v1 manifests
   */
  static DEFAULT_METHODS = [
    "get" as const,
    "post" as const,
    "put" as const,
    "patch" as const,
  ];

  /**
   * This describes the default parameter configuration for legacy v1 manifests:
   * 1. all legacy manifests will take an optional `id` parameter
   *    which determines what application will be fetched as the `Application`
   *    input
   */
  static DEFAULT_PARAMETERS = [
    Object.freeze({
      key: "id",
      format: "uuid",
    }),
  ];

  /**
   * This describes the default input behavior for compatibility with v1
   * manifests; the following behavior is observed:
   * 1. Applications are fetched by ID parameter with GENEROUS graph
   * 2. Redis cache data is fetched for applciationState and userState
   * 3. Three auth strategies are attempted in optional mode
   *    a. NEAS session
   *    b. LDS webhook
   *    c. Plaid webhook
   */
  static DEFAULT_INPUTS = Object.freeze({
    "*": "inputs",
    env: "inputs/env",
    application: {
      "*": "application/single.flattened",
      application: "application-by-id-param",
    },
    applications: [],
    applicationState: "application-state",
    userState: "user-state",
    /**
     * Aggregates all authStrategies using the "optional" mode
     */
    auth: {
      "*": "auth-artifacts",
      /**
       * each strategy is attempted in parallel then combined using the
       * "auth-artifacts" contract
       */
      strategies: [
        {
          "*": "inputs/auth.neas-session",
          response: "neas.verify-token",
          authorization: [
            "inputs/auth.neas-application-auth",
            "inputs/auth.neas-user-auth",
            "inputs/auth.neas-monolith-auth",
          ],
        },
        {
          "*": "inputs/auth.internal-bearer",
          source: {
            "*": "inputs/auth.token-source",
            key: "inputs/auth.bearer-token",
          },
          authorization: [{ "@": "lds-apply-flow-service" }],
        },
      ] as ManifestContracts[],
    },
  });

  /**
   * Given the manifest's definition, return the methods it supports
   */
  static getMethods(definition: ManifestJson[]): Method[] {
    return definition.reduce(
      (a, { methods }) => Array.from(new Set([...a, ...(methods || [])])),
      [] as Method[],
    );
  }

  /**
   * Converts the manifest definition into one or more distinct middleware
   * handlers for gathering inputs
   */
  static getDefinitionForMethods(
    definition: ManifestJson[],
  ): Record<Method, ManifestJson> {
    const byMethod = {} as Record<Method, ManifestJson>;
    const universal = {} as ManifestJson;

    definition.forEach((d) => {
      const { methods } = d;

      // Push array-like definitions
      Object.freeze(["parameters" as const]).forEach((key) => {
        const { [key]: arrayLike } = d;

        if (arrayLike) {
          if (methods && methods.length) {
            // Update only methods that are specified
            methods.forEach((method) => {
              const methodDefinition = (byMethod[method] =
                byMethod[method] || {});
              // If universal definitions already exist, add them before custom definitions
              const methodArray = (methodDefinition[key] = methodDefinition[
                key
              ] || [...(universal[key] || [])]);
              methodArray.push(...arrayLike);
            });
          } else {
            const universalArray = (universal[key] = universal[key] || []);
            universalArray.push(...arrayLike);

            // If a method already has custom definitions, add universal definitions on top
            Object.keys(byMethod).forEach((method: Method) => {
              const methodDefinition = byMethod[method];
              const methodArray = methodDefinition[key];
              if (methodArray) {
                methodArray.push(...arrayLike);
              }
            });
          }
        }
      });

      // Assign object-like definitions
      Object.freeze([
        "permissions" as const,
        "inputs" as const,
        "outputs" as const,
      ]).forEach((key) => {
        const { [key]: objectLike } = d;

        if (objectLike) {
          if (methods && methods.length) {
            methods.forEach((method) => {
              if (!(method in byMethod)) {
                Object.assign(byMethod, { [method]: {} });
              }

              const methodDefinition = byMethod[method];
              const universalDefinition = universal[key];

              // If universal definitions already exist, add them before custom definitions
              if (!(key in methodDefinition)) {
                Object.assign(methodDefinition, {
                  [key]: { ...universalDefinition } || {},
                });
              }

              const methodObject = methodDefinition[key];

              assert(methodObject);

              Object.assign(methodObject, objectLike);
            });
          } else {
            if (!(key in universal)) {
              Object.assign(universal, { [key]: {} });
            }

            const universalObject = universal[key];

            assert(universalObject);

            Object.assign(universalObject, objectLike);

            // If a method already has custom definitions, add universal definitions on top
            Object.keys(byMethod).forEach((method: Method) => {
              const methodDefinition = byMethod[method];
              const methodObject = methodDefinition[key];
              if (methodObject) {
                Object.assign(universalObject, objectLike);
              }
            });
          }
        }
      });
    });

    // If no specific methods were defined, return just the universal definitions
    if (!Object.keys(byMethod).length) {
      return { use: universal } as Record<Method, ManifestJson>;
    }

    // If at least one method was specified, apply any
    Object.keys(byMethod).forEach((key: Method) => {
      const methodDefinition = byMethod[key];

      Object.freeze([
        "parameters" as const,
        "permissions" as const,
        "inputs" as const,
        "outputs" as const,
      ]).forEach((parameterKey) => {
        if (!(parameterKey in methodDefinition)) {
          Object.defineProperty(methodDefinition, parameterKey, {
            value: universal[parameterKey],
          });
        }
      });
    });

    return byMethod;
  }

  /**
   * Given a compressed manifest json,
   * construct the routable paths for the paramters definition
   */
  static getPaths(name: string, json: ManifestJson): string[] {
    const paths: string[] = [];
    let path = "/" + name;

    const { parameters: [...parameters] = [] } = json;

    /* eslint-disable-next-line no-constant-condition */
    while (true) {
      const parameter = parameters.shift();

      // push the current path if all parameters have been processed or if the current
      // parameter is required
      if (parameter?.required !== true && !paths.includes(path)) {
        paths.push(path);
      }

      // if there are no more parameters to process, break out of the loop
      if (!parameter) break;

      const { key, format } = parameter;

      /* ============================== *
       * The current path will be modified in place to include the parameters in this key
       * ============================== */

      path += `/:${key}`;

      if (format?.toLowerCase() === constants.ParameterFormat.uuid) {
        path += `(${constants.UUID_REGEX.source})`;
      } else if (format?.toLowerCase() === constants.ParameterFormat.integer) {
        path += `(${constants.INTEGER_REGEX.source})`;
      } else if (format) {
        path += `(${format})`;
      }
    }

    return paths;
  }

  /**
   * Create an express middleware to handle pre and post authentication layers
   */
  static executionMiddleware(
    name: string,
    definition: ManifestJson,
    contracts: Contracts<unknown>,
  ): {
    input: BoundHandler | undefined;
    output: BoundHandler | undefined;
  } {
    const { inputs, outputs } = definition;

    const inputManifest =
      inputs && new Manifest<unknown>(name, inputs, contracts);
    const outputManifest =
      outputs && new Manifest<Input<unknown>>(name, outputs, contracts);

    const inputHandler: BoundHandler | undefined =
      inputManifest &&
      async function (context, req, res, next) {
        /**
         * Errors need to be tracked across middleware functions so that
         * the error handler can parse through them, regardless of what
         * happens during manifest execution
         */
        const errors = (res.locals.errors = {});

        /**
         *
         */
        const input = (res.locals.input = {
          application: null,
          applicationState: null,
        });

        const manifest = (res.locals.manifest = inputManifest);

        try {
          const result = await manifest.execute(
            context,
            { errors },
            {
              ...input,
              manifest,
              request: req,
              response: res,
              env: context.env,
              credentials: context.loadedPlugins.credentials.instance,
            },
          );

          res.locals.input = result.toJSON() as typeof res.locals.input;
        } catch (error) {
          errors[outputManifest.id] = [error];
        }

        return next();
      };

    const outputHandler: BoundHandler | undefined =
      outputManifest &&
      async function (context, req, res, next) {
        const errors = (res.locals.errors = res.locals.errors || {});
        const input = res.locals.input;
        const manifest = outputManifest;

        try {
          const result = await manifest.execute(
            context,
            { errors },
            { ...input, manifest, request: req, response: res },
          );

          if (Object.keys(errors).length) {
            return next();
          }

          return res.send(result);
        } catch (error) {
          errors[outputManifest.id] = [error];
        }

        return next();
      };

    return { input: inputHandler, output: outputHandler };
  }

  constructor(
    name: string,
    contractKeys: ManifestContracts,
    contracts: Contracts<I>,
  ) {
    this.id = name;
    this.contractKeys = contractKeys;

    this.executables = Object.keys(contractKeys).reduce((agg, key) => {
      if (
        key === constants.LITERAL_CONTRACT &&
        !(constants.SYNC_CONTRACT in agg)
      ) {
        return {
          ...agg,
          [constants.RESERVED_CONTRACT_KEYS[constants.SYNC_CONTRACT]]:
            new Contract({
              raw: JSON.stringify(contractKeys[key]),
            }),
        };
      }

      const evaluationKey = Object.keys(
        constants.RESERVED_CONTRACT_KEYS,
      ).includes(key)
        ? constants.RESERVED_CONTRACT_KEYS[key]
        : key;

      return {
        ...agg,
        [evaluationKey]: this.aggregateContracts(
          contractKeys[key],
          contracts,
          evaluationKey,
        ),
      };
    }, {});
  }

  /**
   *
   */
  aggregateContracts(
    contractKeys: ManifestContracts[string],
    contracts: Contracts<I>,
    mappingKey?: string,
  ) {
    /* ============================== *
     * I. If the definition is an array, iterate over each element
     * ============================== */

    if (Array.isArray(contractKeys)) {
      return contractKeys.map((subDefinition, i) =>
        this.aggregateContracts(
          subDefinition,
          contracts,
          (mappingKey || "") + `[${String(i)}]`,
        ),
      );
    }

    /* ============================== *
     * II. If the definition is a nested manifest, return it as an executable
     * in place of a contract. When executed, it will return its contracts as
     * its result, in an isolated context
     * ============================== */

    if (typeof contractKeys === "object") {
      return new Manifest(
        this.id + (mappingKey ? "." + mappingKey : ""),
        contractKeys,
        contracts,
      );
    }

    const [, key, version = constants.DEFAULT_VERSION] =
      /^([^.]+)(?:\.(.+))?$/.exec(contractKeys) || [];

    const contract = contracts?.[key]?.[version];

    if (!contract) {
      throw new Error(
        `[32ed6135] Manifest referenced a non-existent or invalid contract (${key}.${version}), while processing manifest ${this.id}`,
      );
    }

    return contract;
  }

  input(
    pluginContext: Context,
    executionContext: ExecutionContext<I>,
    input: I,
  ) {
    const { key, index, evaluations = {} } = executionContext;

    const manifestExecution = new ManifestExecution({
      id: this.id,
      index,
      parent: this,
      evaluations,
      sync: key !== constants.RESERVED_CONTRACT_KEYS[constants.ASYNC_CONTRACT],
    }).input(pluginContext, executionContext, input);

    return manifestExecution;
  }

  async execute(
    pluginContext: Context,
    { evaluations = {}, ...executionContext }: ExecutionContext<I>,
    input: I,
  ) {
    const executable = this.input(
      pluginContext,
      { evaluations, ...executionContext },
      input,
    );

    await executable.execute(
      pluginContext,
      { evaluations, ...executionContext },
      input,
    );

    return executable;
  }
}
