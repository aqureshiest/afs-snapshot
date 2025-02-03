// c8 ignore file
import { Request, Response } from "express";
import httpContext from "express-http-context";
import authenticationMiddleware from "../../../middleware/auth/index.js";
import getApplicationMiddleware from "../../../middleware/applications/index.js";
import { keyGen } from "../../../helpers/transforms/key-gen.js";
import { requestAction } from "../../../helpers/ui/actions/request.js";
import { form } from "../../../helpers/ui/stage/form/builder.js";
import { infoHeader } from "../../../helpers/ui/stage/form/index.js";
import { inputEmail } from "../../../helpers/ui/stage/form/input-email/index.js";
import { infoContent } from "../../../helpers/ui/stage/form/info-content/index.js";

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
          key: "personal-loans",
          label: "Personal Loans",
          submit: {
            copy: "Apply",
            disabled: true,
            action: requestAction({ manifest }),
          },
          rows: [
            infoHeader({
              header: {
                copy: "Personal Loans",
                subCopy: "Submitting this page will create an personal loan application using the email below with Betty Hooper as the applicant.",
              },
            }),
            infoContent({
              content: [
                {
                  key: keyGen("list"),
                  type: "list",
                  componentProps: {
                    items: [
                      {
                        copy: "Submit this page to create an application",
                      },
                      {
                        copy: "Choose loan amount, and decision",
                      },
                      {
                        copy: "View rates",
                      },
                      {
                        copy: "Submit for decision",
                      }
                    ],
                  },
                },
              ],
            }),
            inputEmail(),
          ],
        },
      ],
    });

    return res.json(json);
  },
};
