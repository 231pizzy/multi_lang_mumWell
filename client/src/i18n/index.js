import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import resourcesToBackend from "i18next-resources-to-backend";

// `englishName` is used in instructions to the AI ("Speak only German").
export const LANGUAGES = [
  { code: "en", label: "English", flag: "EN", englishName: "English" },
  { code: "sv", label: "Svenska", flag: "SV", englishName: "Swedish" },
  { code: "de", label: "Deutsch", flag: "DE", englishName: "German" },
  { code: "fr", label: "Français", flag: "FR", englishName: "French" },
  { code: "es", label: "Español", flag: "ES", englishName: "Spanish" },
];
export const LANGUAGE_CODES = LANGUAGES.map((l) => l.code);

// English ships with the app; other languages are fetched on demand.
const englishFiles = import.meta.glob("./locales/en/*.json", { eager: true, import: "default" });
const otherFiles = import.meta.glob(["./locales/*/*.json", "!./locales/en/*.json"], { import: "default" });

const english = Object.fromEntries(
  Object.entries(englishFiles).map(([path, data]) => [path.match(/\/([\w-]+)\.json$/)[1], data]),
);

i18n
  .use(
    resourcesToBackend((language, namespace) => {
      const loader = otherFiles[`./locales/${language}/${namespace}.json`];
      return loader ? loader() : Promise.resolve({});
    }),
  )
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    partialBundledLanguages: true,
    resources: { en: english },
    ns: Object.keys(english),
    defaultNS: "common",
    fallbackLng: "en",
    supportedLngs: LANGUAGE_CODES,
    nonExplicitSupportedLngs: true, // "de-AT" → "de"
    load: "languageOnly",
    detection: {
      order: ["localStorage", "navigator"],
      lookupLocalStorage: "language",
      caches: ["localStorage"],
    },
    interpolation: { escapeValue: false }, // React already escapes
    react: { useSuspense: true },
  });

// Keep <html lang> and the tab title in the current language (screen readers, translation prompts).
const syncHtmlLang = (lng) => {
  document.documentElement.setAttribute("lang", lng);
  if (i18n.exists("common:meta.title")) document.title = i18n.t("common:meta.title");
};
i18n.on("languageChanged", syncHtmlLang);
i18n.on("loaded", () => syncHtmlLang(i18n.resolvedLanguage || "en"));
syncHtmlLang(i18n.resolvedLanguage || "en");

export const currentLanguage = () => i18n.resolvedLanguage || "en";

export default i18n;
