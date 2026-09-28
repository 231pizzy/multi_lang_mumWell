import { messages } from "./messages.js";

export const LANGUAGES = ["en", "sv", "de", "fr", "es"];
export const DEFAULT_LANGUAGE = "en";

// Language names in English, used when instructing the AI which language to write in.
export const LANGUAGE_NAMES = {
  en: "English",
  sv: "Swedish",
  de: "German",
  fr: "French",
  es: "Spanish",
};

export const isSupportedLanguage = (lang) => LANGUAGES.includes(lang);

/** Pick the best supported language from an Accept-Language header ("de-AT,de;q=0.9,en;q=0.8"). */
export function parseAcceptLanguage(header) {
  if (!header) return null;
  const ranked = String(header)
    .split(",")
    .map((part) => {
      const [tag, ...params] = part.trim().split(";");
      const q = params.find((p) => p.trim().startsWith("q="));
      return { lang: tag.trim().slice(0, 2).toLowerCase(), q: q ? Number(q.split("=")[1]) || 0 : 1 };
    })
    .sort((a, b) => b.q - a.q);
  return ranked.find((r) => isSupportedLanguage(r.lang))?.lang ?? null;
}

/** The language for this request: the signed-in user's preference, else the browser's. */
export function requestLanguage(req) {
  if (isSupportedLanguage(req.user?.preferredLanguage)) return req.user.preferredLanguage;
  return parseAcceptLanguage(req.get?.("accept-language")) ?? DEFAULT_LANGUAGE;
}

/** Translate a message code, e.g. t("de", "auth.invalidCredentials"). Falls back to English. */
export function t(lang, code, params = {}) {
  const template = messages[lang]?.[code] ?? messages.en[code] ?? code;
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => String(params[key] ?? ""));
}
