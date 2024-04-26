import { Request, Response, NextFunction } from "express";

/* eslint-disable @typescript-eslint/no-unused-vars */
const executeHandler: Handler = async function (
  context,
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const { manifest, input, auth, manifestState } = res.locals;

  /* ============================== *
   * TODO: Provide context about the request to the execution context so
   * that the manifest can appropriately decide whether or not to try to
   * run each async contract type:
   * ------------------------------ *
   * Mutative: A manifest with any mutative contracts cannot be used
   *   with the GET method
   * Destructive: A manifest with any destructive contracts must be executed
   *   with the DELETE method
   * ============================== */

  const { contract } = await manifest.execute(
    { ...input, manifest, auth, manifestState },
    { context, ...input },
  );

  return res.send(contract);
};

export default executeHandler;
