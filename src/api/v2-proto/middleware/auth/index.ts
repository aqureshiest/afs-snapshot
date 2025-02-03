// c8 ignore file
import httpContext from "express-http-context";

const authenticationMiddleware = (authOptions: unknown) => (req, res, next) => {
  // TODO: Build this out
  const auth = {
    // Expand this with all the auth infos
    isAuthenticated: false,
    hasSession: false,
  }

  httpContext.set("auth", auth);
  next();
}

export default authenticationMiddleware;