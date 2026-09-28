import mongoose from "mongoose";
import { HttpError } from "../utils/httpError.js";
import { logger } from "../utils/logger.js";
import { env } from "../config/env.js";
import { messages } from "../i18n/messages.js";
import { requestLanguage, t } from "../i18n/index.js";

export function notFoundHandler(req, res) {
  res.status(404).json({ message: t(requestLanguage(req), "generic.notFound") });
}

// HttpError messages that are message codes (e.g. "auth.invalidCredentials") are translated.
const localise = (req, message, params) =>
  messages.en[message] ? t(requestLanguage(req), message, params) : message;

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, _next) {
  if (err instanceof HttpError) {
    return res.status(err.status).json({
      message: localise(req, err.message, err.params),
      code: messages.en[err.message] ? err.message : undefined,
      details: err.details,
    });
  }

  if (err instanceof mongoose.Error.ValidationError) {
    const details = Object.fromEntries(
      Object.entries(err.errors).map(([field, e]) => [field, e.message]),
    );
    return res.status(400).json({ message: t(requestLanguage(req), "validation.invalid"), details });
  }

  if (err instanceof mongoose.Error.CastError) {
    return res.status(400).json({ message: t(requestLanguage(req), "validation.invalid"), details: err.path });
  }

  // Malformed JSON body
  if (err.type === "entity.parse.failed") {
    return res.status(400).json({ message: t(requestLanguage(req), "generic.invalidJson") });
  }

  if (err.type === "entity.too.large") {
    return res.status(413).json({ message: t(requestLanguage(req), "generic.tooLarge") });
  }

  logger.error("Unhandled error", {
    method: req.method,
    path: req.originalUrl,
    error: err.message,
    stack: err.stack,
  });

  res.status(500).json({
    message: t(requestLanguage(req), "generic.error"),
    ...(env.isProduction ? {} : { error: err.message }),
  });
}
