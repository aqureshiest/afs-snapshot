import * as handlers from "./handlers/index.js";
import wrapAsyncHandler from "./wrap-async-handler.js";
import * as constants from "./constants.js";
import cookieParser from "cookie-parser";
import authMiddleware from "./auth/index.js";

export const plugin: Plugin = {
  name: "api",
  version: "1.0.0",
  registerOrder: 1,
  register: async (context: Context) => {
    context.application.use(cookieParser());

    /* ============================== *
     * I. All contracts gather inputs and execute contracts
     * ============================== */
    context.application.get(
      "/auth/status",
      wrapAsyncHandler(context, handlers.fakeAuth),
    );

    context.application.use(
      `/apply/*/:id(${constants.UUID_REGEX.source})`,
      wrapAsyncHandler(context, authMiddleware),
      wrapAsyncHandler(context, handlers.getInputs),
      wrapAsyncHandler(context, handlers.getManifest),
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
      wrapAsyncHandler(context, authMiddleware),
      wrapAsyncHandler(context, handlers.getInputs),
      wrapAsyncHandler(context, handlers.getManifest),
      wrapAsyncHandler(context, handlers.execute),
    );

    context.application.use(handlers.error.bind(null, context));
  },
};
