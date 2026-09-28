import { badRequest } from "./httpError.js";

export function requireString(value, field, { max = 5000, min = 1 } = {}) {
  if (typeof value !== "string" || value.trim().length < min) {
    throw badRequest("validation.invalid", { field });
  }
  if (value.length > max) {
    throw badRequest("validation.invalid", { field });
  }
  return value.trim();
}

export function optionalString(value, field, { max = 5000 } = {}) {
  if (value === undefined || value === null || value === "") return undefined;
  if (typeof value !== "string") throw badRequest("validation.invalid", { field });
  if (value.length > max) throw badRequest("validation.invalid", { field });
  return value.trim();
}

export function requireNumber(value, field, { min = -Infinity, max = Infinity, integer = false } = {}) {
  const num = typeof value === "string" && value.trim() !== "" ? Number(value) : value;
  if (typeof num !== "number" || !Number.isFinite(num)) {
    throw badRequest("validation.invalid", { field });
  }
  if (integer && !Number.isInteger(num)) throw badRequest("validation.invalid", { field });
  if (num < min || num > max) throw badRequest("validation.invalid", { field });
  return num;
}

export function isValidEmail(email) {
  return typeof email === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
