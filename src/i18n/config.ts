import { createInstance } from "i18next";
import { initReactI18next } from "react-i18next";

import en from "./locales/en.json";
import es from "./locales/es.json";
import ptBR from "./locales/pt-BR.json";

export const defaultLanguage = "pt-BR";

const i18n = createInstance();

void i18n.use(initReactI18next).init({
  compatibilityJSON: "v4",
  fallbackLng: defaultLanguage,
  interpolation: {
    escapeValue: false
  },
  lng: defaultLanguage,
  resources: {
    "pt-BR": {
      translation: ptBR
    },
    en: {
      translation: en
    },
    es: {
      translation: es
    }
  }
});

export { i18n };
