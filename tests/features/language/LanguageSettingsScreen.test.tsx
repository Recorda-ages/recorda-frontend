import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import { useState } from "react";
import { Pressable, Text } from "react-native";
import { I18nextProvider, useTranslation } from "react-i18next";
import { PaperProvider } from "react-native-paper";

import { AUTH_ME_QUERY_KEY, type CurrentUser } from "@/features/auth/api/getCurrentUser";
import { LanguageSettingsScreen } from "@/features/language";
import { APP_LANGUAGE_KEY, PENDING_LANGUAGE_KEY } from "@/features/language/languagePreference";
import { SETTINGS_QUERY_KEY } from "@/features/settings/queryKeys";
import * as settingsService from "@/features/settings/services/settingsService";
import { i18n } from "@/i18n";
import { paperTheme } from "@/theme";

const mockStore = new Map<string, string>();
const mockGoBack = jest.fn();

jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual("@react-navigation/native"),
  useNavigation: () => ({ goBack: mockGoBack })
}));

jest.mock("@/services/storage", () => ({
  secureStorage: {
    getItem: jest.fn(async (key: string) => mockStore.get(key) ?? null),
    removeItem: jest.fn(async (key: string) => {
      mockStore.delete(key);
    }),
    setItem: jest.fn(async (key: string, value: string) => {
      mockStore.set(key, value);
    })
  }
}));

const currentUser: CurrentUser = {
  language: "pt-BR",
  name: "Gabriel",
  onboarding_completed: true,
  role: "USER",
  user_id: "user-1",
  username: "gabriel"
};

function OtherScreen() {
  const { t } = useTranslation();
  const [taps, setTaps] = useState(0);

  return (
    <Pressable accessibilityRole="button" onPress={() => setTaps((count) => count + 1)}>
      <Text>{`${t("settings.title")} · ${taps}`}</Text>
    </Pressable>
  );
}

function renderScreen() {
  const client = new QueryClient({ defaultOptions: { queries: { gcTime: Infinity } } });
  client.setQueryData(AUTH_ME_QUERY_KEY, currentUser);
  client.setQueryData(SETTINGS_QUERY_KEY, { is_private: false, language: "pt-BR" });

  render(
    <QueryClientProvider client={client}>
      <I18nextProvider i18n={i18n}>
        <PaperProvider theme={paperTheme}>
          <OtherScreen />
          <LanguageSettingsScreen />
        </PaperProvider>
      </I18nextProvider>
    </QueryClientProvider>
  );

  return client;
}

function option(name: string) {
  return screen.getByRole("radio", { name });
}

describe("LanguageSettingsScreen", () => {
  let update: jest.SpyInstance;

  beforeEach(async () => {
    mockStore.clear();
    jest.clearAllMocks();
    update = jest
      .spyOn(settingsService, "updateSettings")
      .mockResolvedValue({ accepted_requests: 0, is_private: false, language: "en" });
    await i18n.changeLanguage("pt-BR");
  });

  afterEach(async () => {
    jest.restoreAllMocks();
    await i18n.changeLanguage("pt-BR");
  });

  it("lists the three languages by their own names with the current one selected", () => {
    renderScreen();

    expect(screen.getByText("Idioma")).toBeTruthy();
    expect(option("Português")).toBeChecked();
    expect(option("English")).not.toBeChecked();
    expect(option("Español")).not.toBeChecked();
  });

  it("changes every mounted screen right away without remounting them", async () => {
    const client = renderScreen();
    fireEvent.press(screen.getByText("Configurações · 0"));
    expect(screen.getByText("Configurações · 1")).toBeTruthy();

    await act(async () => {
      fireEvent.press(option("English"));
    });

    expect(screen.getByText("Settings · 1")).toBeTruthy();
    expect(screen.getByText("Language")).toBeTruthy();
    expect(option("English")).toBeChecked();
    expect(option("Português")).not.toBeChecked();
    expect(mockStore.get(APP_LANGUAGE_KEY)).toBe("en");
    await waitFor(() => expect(update).toHaveBeenCalledWith({ language: "en" }));
    await waitFor(() =>
      expect(client.getQueryData(SETTINGS_QUERY_KEY)).toEqual({
        is_private: false,
        language: "en"
      })
    );
    expect(client.getQueryData<CurrentUser>(AUTH_ME_QUERY_KEY)?.language).toBe("en");
  });

  it("keeps the new language and leaves it to sync later when the account update fails", async () => {
    update.mockRejectedValueOnce(new Error("offline"));
    renderScreen();

    await act(async () => {
      fireEvent.press(option("Español"));
    });

    await waitFor(() =>
      expect(JSON.parse(mockStore.get(PENDING_LANGUAGE_KEY) ?? "null")).toEqual({
        language: "es",
        userId: "user-1"
      })
    );
    expect(i18n.language).toBe("es");
    expect(screen.getByText("Idioma")).toBeTruthy();
    expect(option("Español")).toBeChecked();
    expect(mockStore.get(APP_LANGUAGE_KEY)).toBe("es");
  });

  it("goes back with the header arrow", () => {
    renderScreen();

    fireEvent.press(screen.getByRole("button", { name: "Voltar" }));

    expect(mockGoBack).toHaveBeenCalledTimes(1);
  });
});
