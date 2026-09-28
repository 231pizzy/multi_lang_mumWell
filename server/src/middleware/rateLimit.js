import { ipKeyGenerator, rateLimit } from "express-rate-limit";
import { env } from "../config/env.js";
import { requestLanguage, t } from "../i18n/index.js";

const options = (windowMs, limit, code) => ({
  windowMs,
  limit,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  skip: () => env.isTest,
  handler: (req, res, _next, opts) =>
    res.status(opts.statusCode).json({ message: t(requestLanguage(req), code) }),
});

// Login / register / password reset — slows down credential stuffing.
export const authLimiter = rateLimit(
  options(15 * 60 * 1000, 20, "rateLimit.auth"),
);

// Live voice transcript lines: one request per sentence spoken, so a higher ceiling.
export const transcriptLimiter = rateLimit({
  ...options(60 * 1000, 60, "rateLimit.ai"),
  keyGenerator: (req) => req.user?.id ?? ipKeyGenerator(req.ip),
});

// Endpoints that call the paid LLM API. Mount after requireAuth so limits are per user.
export const aiLimiter = rateLimit({
  ...options(60 * 1000, 20, "rateLimit.ai"),
  keyGenerator: (req) => req.user?.id ?? ipKeyGenerator(req.ip),
});
