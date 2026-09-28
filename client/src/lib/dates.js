import { de, enGB, es, fr, sv } from "date-fns/locale";

const LOCALES = { en: enGB, sv, de, fr, es };

/** date-fns locale for relative times ("3 minutes ago"). */
export const dateLocale = (language) => LOCALES[language] ?? enGB;

const intlLocale = (language) => (language === "en" ? "en-GB" : language);

export const formatDate = (date, language, options = { dateStyle: "medium" }) =>
  new Date(date).toLocaleDateString(intlLocale(language), options);

export const formatTime = (date, language) =>
  new Date(date).toLocaleTimeString(intlLocale(language), { hour: "2-digit", minute: "2-digit" });

export const formatDateTime = (date, language) =>
  new Date(date).toLocaleString(intlLocale(language), { dateStyle: "medium", timeStyle: "short" });
