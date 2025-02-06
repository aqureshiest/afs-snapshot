// c8 ignore file
import { buildRequestBody } from "../index.js";
import httpContext from "express-http-context";

export const createApplication = async (options) => {
  const context = httpContext.get("context");
  const { brand, product } = options;
  const applicationServiceClient =
    context.loadedPlugins.applicationServiceClient.instance;

  const queryDefinition = {
    event: "create",
    rehydrate: false,
    payload: {
      application: {
        root: {
          reference: {
            brand,
            product,
          },
        },
      },
    },
    fields: "application { id root { id }}",
  };

  const { create } =
    (await applicationServiceClient.sendRequest(
      buildRequestBody(
        queryDefinition,
        applicationServiceClient.eventInputTypes[queryDefinition.event],
      ),
      context,
    )) || {};

  const userApplicationId = create?.application?.id;
  const rootApplicationId = create?.application?.root?.id;
  const error = create?.error;

  if (!userApplicationId || !rootApplicationId) {
    throw new Error("Failed to create application");
  }

  return { userApplicationId, rootApplicationId, error };
};
