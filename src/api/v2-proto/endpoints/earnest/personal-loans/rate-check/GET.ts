// c8 ignore file
import { Request, Response } from "express";
import httpContext from "express-http-context";
import authenticationMiddleware from "../../../../middleware/auth/index.js";
import getApplicationMiddleware from "../../../../middleware/applications/index.js";
import { keyGen } from "../../../../helpers/transforms/key-gen.js";
import { requestAction } from "../../../../helpers/ui/actions/request.js";
import { form } from "../../../../helpers/ui/stage/form/builder.js";
import { infoHeader } from "../../../../helpers/ui/stage/form/index.js";
import { inputEmail } from "../../../../helpers/ui/stage/form/input-email/index.js";
import { infoContent } from "../../../../helpers/ui/stage/form/info-content/index.js";

export default {
  middleware: [authenticationMiddleware({}), getApplicationMiddleware()],
  handler: async (req: Request, res: Response) => {
    const { manifest } = httpContext.get("meta");

    const json = form({
      manifest,
      id: req.params.id || "",
      label: "Personal Loans",
      steps: [
        {
          key: "rate-check",
          label: "Rate Check",
          submit: {
            copy: "Get Rates",
            disabled: true,
            action: requestAction({ manifest, id: req.params.id }),
          },
          rows: [
            infoHeader({
              header: {
                copy: "Check my rates",
                subCopy:
                  "Select your loan amount, and desired decision to view rates.",
              },
            }),
          ],
        },
      ],
    });

    return res.json(json);
  },
};
