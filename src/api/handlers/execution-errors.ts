import createError, { HttpError } from "http-errors";

/**
 *
 */
const executionErrors: Handler = async function (context, req, res, next) {
  const { errors, manifest } = res.locals;

  /* ============================== *
   * Check each of the error keys to find the most severe error;
   * Errors that are not HttpErrors are defaulted to an Internal Server Error
   * ============================== */
  const sortedErrors = Object.values(errors)
    // flatten all errors into a single array
    .reduce(
      (a, b) => [
        ...a,
        ...b.map((error) => {
          if (error instanceof HttpError) {
            return error;
          } else {
            context.logger.error({
              message: "Raw error",
              manifest: {
                id: manifest.id,
              },
              error: error,
            });
            return createError(500, error);
          }
        }),
      ],
      [] as HttpError[],
    )
    .sort(
      (a: HttpError, b: HttpError) =>
        Number(b.statusCode) - Number(a.statusCode),
    ) as HttpError[];

  if (sortedErrors.length) {
    const [firstError, ...remainingErrors] = sortedErrors;

    const compositeError = remainingErrors.length
      ? createError(firstError.statusCode, { cause: sortedErrors })
      : firstError;

    context.logger.error({
      message: "execution error",
      manifest: {
        id: manifest.id,
      },
      error: compositeError,
    });

    return next(compositeError);
  }

  return next();
};

export default executionErrors;
