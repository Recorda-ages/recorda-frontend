export const SUPPORTED_LANGUAGES = ["pt-BR", "en", "es"] as const;

export type AppLanguage = (typeof SUPPORTED_LANGUAGES)[number];

export const defaultLanguage: AppLanguage = "pt-BR";

export function isAppLanguage(value: unknown): value is AppLanguage {
  return typeof value === "string" && (SUPPORTED_LANGUAGES as readonly string[]).includes(value);
}
