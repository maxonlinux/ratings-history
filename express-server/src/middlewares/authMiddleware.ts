import { Request, Response, NextFunction } from "express";
import jwt, { JsonWebTokenError, JwtPayload } from "jsonwebtoken";
import config from "../config";
const publicEndpoints = [
  { path: "/files", method: "GET" },
  { path: "/auth/*", method: "POST" }, // Example wildcard: { path: "/public/*", method: "GET" }
];

interface CustomRequest extends Request {
  user?: JwtPayload;
}

const authMiddleware = (
  req: CustomRequest,
  res: Response,
  next: NextFunction
) => {
  const isPublic = publicEndpoints.some((endpoint) => {
    // Exact match
    if (req.path === endpoint.path && req.method === endpoint.method) {
      return true;
    }

    // Wildcard match (e.g., /public/*)
    if (endpoint.path.endsWith("*") && req.method === endpoint.method) {
      const basePath = endpoint.path.slice(0, -1);
      return req.path.startsWith(basePath);
    }

    return false;
  });

  if (isPublic) {
    next();
    return;
  }

  const cookies = req.cookies;

  if (!cookies) {
    res.status(400).json({ error: "No cookies provided", code: "NO_COOKIES" });
    return;
  }

  const token = req.cookies.authToken;

  if (!token) {
    res.status(401).json({ error: "No token provided", code: "INVALID_TOKEN" });
    return;
  }

  try {
    const user = jwt.verify(token, config.secret) as JwtPayload;
    req.user = user;

    next();
  } catch (error) {
    const err = error as JsonWebTokenError;
    if (err.name === "TokenExpiredError") {
      res.status(401).json({ error: "Token expired", code: "TOKEN_EXPIRED" });
      return;
    }

    res.status(403).json({ error: "Forbidden", code: "FORBIDDEN" });
  }
};

export default authMiddleware;
