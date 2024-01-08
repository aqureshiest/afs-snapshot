import { Request, Response, NextFunction } from 'express';
/* eslint-disable @typescript-eslint/no-unused-vars */
const getHandler: Handler = async function (context, req: Request, res: Response, next: NextFunction) {
  /* ============================== *
   * TODO: If contracts have mutations, should we send the execution
   * without running mutations, or throw an error?
   * ============================== */
  return res.send(res.locals.contract);
};

export default getHandler;
