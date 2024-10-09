/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-var-requires */
/**
 * Simulates the creation of accountless sessions or the addition of an email
 * address to a current session
 */
async function accountless(request, state, logger) {
  const { createHash } = require("crypto");

  const payload = JSON.parse(request.body);
  const { applicationId, emailId: email, idToken } = payload;

  state = state || {};

  const token = idToken || (applicationId || email) && createHash("sha1").update(applicationId || email).digest().toString("hex");

  if (!token) {
    logger.error('[SESSION:identify]', payload );
    return {
      statusCode: 400
    }
  }

  const session = state[token] = state[token] || { applicationId, email, notVerified: true };

  logger.info('[SESSION:identify]', payload, "->", session);

  if (email && session.email !== email) {
    session.email = email;
    session.userId = Date.now();
  }

  return {
    statusCode: 201,
    headers: {
      "Access-Control-Allow-Credentials": true,
      "Access-Control-Allow-Origin": "http://localhost:4000",
      "Content-Type": "application/json"
    },
    body: {
      notification_type: "application_unauthenticated_continue",
      session: token,
      userId: session.userId,
      user: { ...session, id: session.userId },
    }
  }
}

