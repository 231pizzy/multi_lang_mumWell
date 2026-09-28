import { getCountries, getCountryCallingCode, parsePhoneNumberFromString } from "libphonenumber-js";
import { badRequest } from "./httpError.js";

const COUNTRIES = new Set(getCountries());

export const isValidCountry = (code) => typeof code === "string" && COUNTRIES.has(code.toUpperCase());

/** ISO 3166-1 alpha-2 country code, upper-cased. */
export function requireCountry(value) {
  if (!isValidCountry(value)) throw badRequest("auth.countryRequired");
  return value.toUpperCase();
}

// Digits, spaces, dots, dashes and brackets, with at most one leading "+".
const PHONE_CHARACTERS = /^\+?[\d\s().-]+$/;

/**
 * A phone number in international E.164 form ("+46701234567"). Numbers written without a
 * country code are read as belonging to `country`; numbers written with one must use that
 * country's code (countries sharing a code, like the US and Canada, are both accepted).
 */
export function requirePhone(value, country) {
  const raw = typeof value === "string" ? value.trim() : "";
  if (!raw || raw.length > 30 || !PHONE_CHARACTERS.test(raw)) throw badRequest("auth.invalidPhone");
  const home = isValidCountry(country) ? country.toUpperCase() : undefined;
  const phone = parsePhoneNumberFromString(raw, home);
  if (!phone?.isValid()) throw badRequest("auth.invalidPhone");
  if (home && phone.countryCallingCode !== getCountryCallingCode(home)) {
    throw badRequest("auth.phoneCountryMismatch");
  }
  return phone.number;
}

/** Best-effort E.164 for a number a user said or typed in conversation; the raw text otherwise. */
export function tidyPhone(value, country) {
  const raw = String(value ?? "").trim().slice(0, 40);
  if (!raw) return undefined;
  const phone = parsePhoneNumberFromString(raw, isValidCountry(country) ? country.toUpperCase() : undefined);
  return phone?.isValid() ? phone.number : raw;
}
