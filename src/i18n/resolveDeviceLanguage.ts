import { getLocales } from "expo-localization";

import { type AppLanguage, defaultLanguage } from "./languages";

const LANGUAGE_BY_CODE: Record<string, AppLanguage> = {
  en: "en",
  es: "es",
  pt: "pt-BR"
};

export function resolveDeviceLanguage(): AppLanguage {
  try {
    const code = getLocales()[0]?.languageCode?.toLowerCase();
    return (code && LANGUAGE_BY_CODE[code]) || defaultLanguage;
  } catch {
    return defaultLanguage;
  }
}
