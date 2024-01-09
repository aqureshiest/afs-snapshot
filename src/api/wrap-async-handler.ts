import { Request, Response, NextFunction } from 'express';
/**
 * Wraps async handlers with a try/catch block and bound context
 */
export default function (context: Context, handler: BoundHandler): Handler {
  const boundHandler = handler.bind(null, context);

  return async function (req: Request, res: Response, next: NextFunction) {
    try {
      await boundHandler(req, res, next);
    } catch (error) {
      context.logger.error({
        message: error.message,
        stack: error.stack,
      });
      return next(error);
    }
  };
}
