/* eslint-disable no-undef */
/**
 * Simulates the verification of an idtoken and the 
 * address to a current session
 */
async function verify(request, state, logger) {
  const payload = JSON.parse(request.body);
  const { token } = payload;

  state = state || {};
  const session = state[token] = state[token] || {};

  logger.info('[SESSION:verify]', token, "->", session);

  return {
    statusCode: 200,
    headers: {
      "Access-Control-Allow-Credentials": true,
      "Access-Control-Allow-Origin": "http://localhost:3000",
      "Content-Type": "application/json"
    },
    body: {
      ...session,
      isValid: true,
      exp: Math.floor(Date.now() / 1000) + (60 * 30),
      payload: {
        ...session,
        iat: Date.now()
      }
    }
  }
}

