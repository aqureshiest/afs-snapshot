import assert from "node:assert";
import cookieParser from "cookie-parser";
import express from "express";

import * as handlers from "./handlers/index.js";
import wrapAsyncHandler from "./wrap-async-handler.js";
import * as constants from "./constants.js";
import authMiddleware from "./auth/index.js";

export const plugin: Plugin = {
  name: "api",
  version: "1.0.0",
  registerOrder: 1,
  register: async (context: Context) => {
    context.application.use(cookieParser());

    const manifestExecution = context.loadedPlugins.contractExecution.instance;

    assert(manifestExecution, "[b737cbc1] Manifests not instantiated");

    const { manifests, contracts, Manifest } = manifestExecution;

    const router = express.Router();

    Object.keys(manifests).forEach((key) => {
      const manifestMethods = manifests[key];

      Object.keys(manifestMethods).forEach(
        (method: keyof typeof manifestMethods) => {
          const definition = manifestMethods[method];

          const paths = Manifest.getPaths(key, definition);

          const { input, output } = Manifest.executionMiddleware(
            key,
            definition,
            contracts,
          );

          /* ============================== *
           * TODO [LA-714]: The watcher cannot dynamically re-register express handlers, so
           * an alternative might have to be applied to replace the behavior inside of
           * those handlers instead
           * ============================== */

          /* ============================== *
           * 1: After each of the input / output execution stages,
           *    check for execution errors
           * ============================== */
          paths.forEach((path) => {
            if (input) {
              router[method.toLowerCase()](
                path,
                wrapAsyncHandler(context, input),
              );
              router[method.toLowerCase()](
                path,
                wrapAsyncHandler(context, handlers.executionErrors),
              );
            }

            if (output) {
              router[method.toLowerCase()](
                path,
                wrapAsyncHandler(context, output),
              );
              router[method.toLowerCase()](
                path,
                wrapAsyncHandler(context, handlers.executionErrors),
              );
            }
          });
        },
      );
    });

    router.use(wrapAsyncHandler(context, handlers.notFound));

    /* ============================== *
     * 2: convert regular errors into InternalServerErrors
     *    and set response status code and headers
     * ============================== */

    router.use(handlers.error.bind(null, context));

    /* ============================== *
     * 3: Delineate representation errors and mutation errors
     * ------------------------------ *
     * Representation: GET requests may need specially formatted responses to
     *    inform UI requests how to represent an error screen or error component
     * Mutation: Mutative requests need to send a standard response so that
     *    components driving actions in the UI know
     *    how to respond to and present failures
     * ============================== */

    router.use(handlers.representationError.bind(null, context));
    router.use(handlers.mutationError.bind(null, context));

    context.application.use("/apply", router);

    /* ============================== *
     * I. All contracts gather inputs and execute contracts
     * ============================== */

    // context.application.use(
    //   `/apply/*/:id(${constants.UUID_REGEX.source})`,
    //   wrapAsyncHandler(context, authMiddleware),
    //   wrapAsyncHandler(context, handlers.getInputs),
    //   wrapAsyncHandler(context, handlers.getManifest),
    //   wrapAsyncHandler(context, handlers.execute),
    // );
    /**
     * @openapi
     * /apply/*:
     *   servers: ["{{application}}"]
     *   get:
     *     description: Execute a representative contract
     *     parameters:
     *      - manifest: string
     *        in: path
     *        required: true
     *      - authorization: string
     *        in: headers
     *        required: false
     *     responses:
     *       200:
     *         description: Returns an executed contract based on the provided parameters.
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *   post:
     *     description: Execute a mutative contract
     *     parameters:
     *      - manifest: string
     *        in: path
     *        required: true
     *      - authorization: string
     *        in: headers
     *        required: false
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *     responses:
     *       200:
     *         description: Execution results.
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     */
  },
};
