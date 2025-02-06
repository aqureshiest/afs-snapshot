// c8 ignore file
import { buildRequestBody } from "../index.js";
import httpContext from "express-http-context";

export const addDetails = async (payload: {
  id: string;
  details: { [key: string]: unknown };
}) => {
  const context = httpContext.get("context");

  const applicationServiceClient =
    context.loadedPlugins.applicationServiceClient.instance;

  const queryDefinition = {
    event: "addDetails",
    payload,
    fields: "application { id }",
  };

  const resp =
    (await applicationServiceClient.sendRequest(
      buildRequestBody(
        queryDefinition,
        applicationServiceClient.eventInputTypes[queryDefinition.event],
      ),
      context,
    )) || {};

  return resp;
};
