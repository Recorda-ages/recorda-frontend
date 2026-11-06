import { resolveDeviceLanguage } from "@/i18n/resolveDeviceLanguage";

import type * as LocalizationMock from "../mocks/expoLocalization";
import { resetLocalizationMock, setMockLocales } from "../mocks/expoLocalization";

type MockLocales = Parameters<typeof LocalizationMock.setMockLocales>[0];

function startLanguage(locales: MockLocales) {
  let language = "";

  jest.isolateModules(() => {
    jest.requireActual<typeof LocalizationMock>("expo-localization").setMockLocales(locales);
    language = jest.requireActual<typeof import("@/i18n/config")>("@/i18n/config").i18n.language;
  });

  return language;
}

describe("resolveDeviceLanguage", () => {
  afterEach(() => resetLocalizationMock());

  it.each([
    ["pt", "pt-BR", "pt-BR"],
    ["pt", "pt-PT", "pt-BR"],
    ["en", "en-US", "en"],
    ["EN", "en-GB", "en"],
    ["es", "es-MX", "es"],
    ["fr", "fr-FR", "pt-BR"],
    [null, "und", "pt-BR"]
  ])("maps the device language %s (%s) to %s", (languageCode, languageTag, expected) => {
    setMockLocales([{ languageCode, languageTag }]);

    expect(resolveDeviceLanguage()).toBe(expected);
  });

  it("falls back to Portuguese when the device reports no locale", () => {
    setMockLocales([]);

    expect(resolveDeviceLanguage()).toBe("pt-BR");
  });

  it.each([
    [[{ languageCode: "en", languageTag: "en-US" }], "en"],
    [[{ languageCode: "es", languageTag: "es-AR" }], "es"],
    [[{ languageCode: "fr", languageTag: "fr-FR" }], "pt-BR"]
  ])("opens the app in the device language", (locales, expected) => {
    expect(startLanguage(locales)).toBe(expected);
  });
});
