// c8 ignore file
import httpContext from "express-http-context";
import { TEMP_DEFAULT_APPLICATION_QUERY } from "../../../../clients/application-service/graphql.js";
import { applicationTransform } from "./application-transform.js";

type Options = {
  query?: string;
  variables?: Record<string, unknown>;
}

const getApplicationMiddleware =
  (
    options: Options = {}
  ) =>
  async (req, res, next) => {
    const applicationId = req.params.id;
    const context = httpContext.get("context");

    if (applicationId) {
      const applicationServiceClient =
        context.loadedPlugins.applicationServiceClient?.instance;
      if (!applicationServiceClient)
        throw new Error(
          "[df9etc7f] Application Service client instance not found"
        );
      const { application } = await applicationServiceClient["sendRequest"](
        {
          query: options?.query || TEMP_DEFAULT_APPLICATION_QUERY,
          variables: {
            id: applicationId,
            root: true,
            ...(options?.variables || {}),
          },
        },
        context
      );

      const transformedApplication = applicationTransform(applicationId, application);

      httpContext.set("application", transformedApplication);
    }
    next();
  };

export default getApplicationMiddleware;
