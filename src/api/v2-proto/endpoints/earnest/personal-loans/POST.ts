// c8 ignore file
import { Request, Response } from "express";
import { createApplication } from "../../../helpers/application-events/create/index.js";
import { createSession } from "../../../helpers/session/create-session.js";
import {navigateAction} from "../../../helpers/ui/actions/navigate.js";
import toastAction from "../../../helpers/ui/actions/toast.js";
import { productConfig } from "./product-config.js";
import { addDetails } from "../../../helpers/application-events/add-details/index.js";
import { inputToDetail } from "../../../helpers/transforms/input-to-detail/index.js";
import { Betty } from "../../../helpers/fixtures/users/betty.js";

export default {
  handler: async (req: Request, res: Response) => {
    const payload = req.body.values;
    // 1. Create session
    const session = createSession();
  
    // 2. Create application - returns applicantId
    const { userApplicationId, error = true } = await createApplication({
      brand: productConfig.brand,
      product: productConfig.code,
    });

    if (error) {
      res.json({ action: toastAction({ type: "error", message: "Failed to create an application" }) });
    }

    // Add Email and hard coded details to application
    const details = await addDetails({
      id: userApplicationId,
      // Email comes from payload
      email: inputToDetail.email(payload.email),
      // Hard coded details
      name: inputToDetail.name(Betty.name),
      address: inputToDetail.address(Betty.address),
      dateOfBirth: inputToDetail.date(Betty.dob),
      phone: inputToDetail.phone(Betty.phone),
    });

    console.log("DETAILS", details);
    
    res.json({ action: navigateAction({
      goTo: `${productConfig.baseUrl}/rate-check/${userApplicationId}`,
    })});
  }
};
