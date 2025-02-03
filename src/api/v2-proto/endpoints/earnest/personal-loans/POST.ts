// c8 ignore file
import httpContext from "express-http-context";
import { Request, Response } from "express";
import { createApplication } from "../../../helpers/application-events/create/index.js";
import { createSession } from "../../../helpers/session/create-session.js";
import { navigateAction } from "../../../helpers/ui/actions/navigate.js";
import toastAction from "../../../helpers/ui/actions/toast.js";
import { productConfig } from "./product-config.js";
import { addDetails } from "../../../helpers/application-events/add-details/index.js";
import { inputToDetail } from "../../../helpers/transforms/input-to-detail/index.js";
import { Betty } from "../../../helpers/fixtures/users/betty.js";

export default {
  handler: async (req: Request, res: Response) => {
    const context = httpContext.get("context");
    const payload = req.body.values;
    const ERROR_ACTION = {
      action: toastAction({
        type: "error",
        message: "Failed to create an application",
      }),
    };

    try {
      context.logger.info("Creating application - PL");
      const { userApplicationId, error = true } = await createApplication({
        brand: productConfig.brand,
        product: productConfig.code,
      });

      if (error) {
        context.logger.error("Application Service - Returned Error", error);
        res.json(ERROR_ACTION);
      }

      context.logger.info("Adding Application Details - PL");
      // Add Email and hard coded details to application
      const { error: addDetailsError } = await addDetails({
        id: userApplicationId,
        // Email comes from payload
        details: {
          email: inputToDetail.email(payload.email),
          // Hard coded details
          name: inputToDetail.name(Betty.name),
          location: inputToDetail.address(Betty.address),
          dateOfBirth: inputToDetail.date(Betty.dob),
          phone: inputToDetail.phone(Betty.phone),
        }
      });

      if (addDetailsError) {
        context.logger.error("Application Service - Add Details Error", addDetailsError);
        res.json(ERROR_ACTION);
      }

      res.json({
        action: navigateAction({
          goTo: `${productConfig.baseUrl}/rate-check/${userApplicationId}`,
        }),
      });
    } catch (creationError) {
      context.logger.error("Application Service - Unhandled Error", creationError);
      res.json(ERROR_ACTION);
    }
  },
};
