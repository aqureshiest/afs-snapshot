import * as handlers from "./handlers/index.js";
import wrapAsyncHandler from "./wrap-async-handler.js";
import * as constants from "./constants.js";

export const plugin: Plugin = {
  name: "api",
  version: "1.0.0",
  registerOrder: 1,
  register: async (context: Context) => {
    /* ============================== *
     * I. All contracts gather inputs and execte contracts
     * ============================== */

    context.application.use(
      `/apply/*/:id(${constants.UUID_REGEX.source})`,
      handlers.getManifest.bind(null, context),
      wrapAsyncHandler(context, handlers.getInputs),
      wrapAsyncHandler(context, handlers.execute),
    );

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
    context.application.use(
      "/apply/*",
      handlers.getManifest.bind(null, context),
      wrapAsyncHandler(context, handlers.getInputs),
      wrapAsyncHandler(context, handlers.execute),
    );

    context.application.use(handlers.error.bind(null, context));
  },
};
