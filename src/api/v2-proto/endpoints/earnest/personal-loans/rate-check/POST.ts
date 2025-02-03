// c8 ignore file
import { addDetails } from "../../../../helpers/application-events/add-details/index.js";
import { createApplication } from "../../../../helpers/application-events/create/index.js";
import { createSession } from "../../../../helpers/session/create-session.js";
import { dateTransforms } from "../../../../helpers/transforms/date.js";
import { inputToDetail } from "../../../../helpers/transforms/input-to-detail/index.js";
import { navigateAction } from "../../../../helpers/ui/actions/navigate.js";
import toastAction from "../../../../helpers/ui/actions/toast.js";

export default {
  handler: async (req, res) => {
    const payload = req.body.values;

    // 1. Add details
    // loan amount (from payload)
    // decisionType (from payload) - only approved for now

    // Hardcode needed details to obtain rates
    // Add ssn reference to the application (needs PII service)

    // 2. Send payload to LDS

    // 3. Return navigate to `rate-check-results`
    res.json({ action: toastAction({ type: "error", message: "This POST is not yet configured" }) });
  }
};
