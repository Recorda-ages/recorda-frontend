type MockLocale = { languageCode: string | null; languageTag: string };

const DEFAULT_LOCALES: MockLocale[] = [{ languageCode: "pt", languageTag: "pt-BR" }];

let locales = DEFAULT_LOCALES;

export function getLocales() {
  return locales;
}

export function setMockLocales(next: MockLocale[]) {
  locales = next;
}

export function resetLocalizationMock() {
  locales = DEFAULT_LOCALES;
}
