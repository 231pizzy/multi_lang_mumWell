import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { Session } from "../models/Session.js";
import { User } from "../models/User.js";
import { unauthorized } from "../utils/httpError.js";

export function getBearerToken(req) {
  const header = req.get("authorization") || "";
  const [scheme, token] = header.split(" ");
  return scheme?.toLowerCase() === "bearer" && token ? token : null;
}

// Requires a valid, non-revoked token. Sets req.user and req.token.
export async function requireAuth(req, _res, next) {
  const token = getBearerToken(req);
  if (!token) throw unauthorized();

  let payload;
  try {
    payload = jwt.verify(token, env.jwtSecret);
  } catch {
    throw unauthorized("auth.sessionExpired");
  }

  const [session, user] = await Promise.all([
    Session.findOne({ token }).select("_id").lean(),
    User.findById(payload.userId),
  ]);
  if (!session) throw unauthorized("auth.sessionEnded");
  if (!user) throw unauthorized("auth.accountNotFound");

  req.user = user;
  req.token = token;
  next();
}
