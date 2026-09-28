import { getCountries, getCountryCallingCode, getExampleNumber, parsePhoneNumberFromString } from "libphonenumber-js";
import examples from "libphonenumber-js/mobile/examples";

const CODES = getCountries();
const cache = new Map();

/** Every country as { code, name, dial }, named and sorted for the given UI language. */
export function countryOptions(language) {
  if (!cache.has(language)) {
    let names;
    try {
      names = new Intl.DisplayNames([language], { type: "region" });
    } catch {
      names = null;
    }
    const collator = new Intl.Collator(language);
    const list = CODES.map((code) => ({
      code,
      name: names?.of(code) ?? code,
      dial: `+${getCountryCallingCode(code)}`,
    })).sort((a, b) => collator.compare(a.name, b.name));
    cache.set(language, list);
  }
  return cache.get(language);
}

export const isKnownCountry = (code) => CODES.includes(code);

/** The country implied by the browser's language settings, e.g. "sv-SE" → "SE". */
export function browserCountry() {
  try {
    for (const tag of navigator.languages ?? [navigator.language]) {
      const region = new Intl.Locale(tag).maximize().region;
      if (region && CODES.includes(region)) return region;
    }
  } catch {
    // Older browsers without Intl.Locale.
  }
  return "";
}

export const callingCode = (country) => (isKnownCountry(country) ? `+${getCountryCallingCode(country)}` : "");

// Mirrors server/src/utils/contact.js: digits, spaces, dots, dashes, brackets, one leading "+".
const PHONE_CHARACTERS = /^\+?[\d\s().-]+$/;

/** Whether the number is written with its own country code ("+234…" or "00234…"). */
export const hasOwnCountryCode = (phone) => /^\s*(\+|00)/.test(phone ?? "");

/**
 * What's wrong with a phone number for `country`: null when fine, "invalid" when it isn't a
 * real number, "mismatch" when its country code belongs to a different country.
 */
export function phoneProblem(phone, country) {
  const raw = phone?.trim() ?? "";
  if (!raw || raw.length > 30 || !PHONE_CHARACTERS.test(raw)) return "invalid";
  try {
    const parsed = parsePhoneNumberFromString(raw, isKnownCountry(country) ? country : undefined);
    if (!parsed?.isValid()) return "invalid";
    if (isKnownCountry(country) && parsed.countryCallingCode !== getCountryCallingCode(country)) return "mismatch";
    return null;
  } catch {
    return "invalid";
  }
}

export const isValidPhone = (phone, country) => phoneProblem(phone, country) === null;

/** A realistic local mobile number for the country, used as the input placeholder. */
export function examplePhone(country) {
  try {
    return isKnownCountry(country) ? (getExampleNumber(country, examples)?.formatNational() ?? "") : "";
  } catch {
    return "";
  }
}

/** A country's name in the given UI language, e.g. ("DE", "fr") → "Allemagne". */
export function countryName(code, language) {
  return countryOptions(language).find((c) => c.code === code)?.name ?? code;
}
