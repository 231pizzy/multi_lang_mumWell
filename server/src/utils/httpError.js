/**
 * `message` may be a message code from i18n/messages.js (e.g. "auth.invalidCredentials"),
 * which the error handler translates into the user's language using `params`.
 */
export class HttpError extends Error {
  constructor(status, message, details, params) {
    super(message);
    this.status = status;
    this.details = details;
    this.params = params;
  }
}

export const badRequest = (message, details) => new HttpError(400, message, details);
export const unauthorized = (message = "auth.required") => new HttpError(401, message);
export const forbidden = (message = "You do not have access to this resource") =>
  new HttpError(403, message);
export const notFound = (message = "generic.notFound") => new HttpError(404, message);
