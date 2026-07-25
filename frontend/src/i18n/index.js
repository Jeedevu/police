import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import en from "./locales/en.json";
import kn from "./locales/kn.json";
import hi from "./locales/hi.json";

export const SUPPORTED_LANGUAGES = [
  { code: "en", name: "English", nativeName: "English", flag: "🇮🇳" },
  { code: "kn", name: "Kannada", nativeName: "ಕನ್ನಡ", flag: "🇮🇳" },
  { code: "hi", name: "Hindi", nativeName: "हिन्दी", flag: "🇮🇳" },
  { code: "ta", name: "Tamil", nativeName: "தமிழ்", flag: "🇮🇳" },
  { code: "te", name: "Telugu", nativeName: "తెలుగు", flag: "🇮🇳" },
  { code: "ml", name: "Malayalam", nativeName: "മലയാളം", flag: "🇮🇳" },
];

const resources = {
  en: { translation: en },
  kn: { translation: kn },
  hi: { translation: hi },
  ta: { translation: kn },
  te: { translation: kn },
  ml: { translation: kn },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: "en",
    supportedLngs: SUPPORTED_LANGUAGES.map((l) => l.code),
    debug: false,
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ["localStorage", "navigator"],
      lookupLocalStorage: "ksp_language",
      caches: ["localStorage"],
    },
    react: {
      useSuspense: false,
    },
  });

const updateDocumentAttributes = (lng) => {
  if (typeof document !== "undefined") {
    document.documentElement.setAttribute("lang", lng);
    document.body.setAttribute("data-lang", lng);
  }
};

i18n.on("languageChanged", (lng) => {
  updateDocumentAttributes(lng);
});

updateDocumentAttributes(i18n.language || "en");

export default i18n;
