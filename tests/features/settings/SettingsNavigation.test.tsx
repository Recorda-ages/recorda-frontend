import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react-native";
import type { NavigationContainerRefWithCurrent } from "@react-navigation/native";

import { RootNavigator } from "@/app/navigation/RootNavigator";
import type { RootStackParamList } from "@/app/navigation/RootNavigator";
import { AppProviders } from "@/app/providers/AppProviders";
import { queryClient } from "@/app/providers/queryClient";
import { AUTH_ME_QUERY_KEY } from "@/features/auth/api/getCurrentUser";
import * as musicApi from "@/features/onboarding/api/music";
import { SETTINGS_QUERY_KEY } from "@/features/settings/queryKeys";
import * as service from "@/features/settings/services/settingsService";
import { i18n } from "@/i18n";
import { secureStorage } from "@/services/storage";

let mockNavigationRef: NavigationContainerRefWithCurrent<RootStackParamList>;
jest.mock("@react-navigation/native", () => {
  const actual = jest.requireActual("@react-navigation/native");
  return {
    ...actual,
    useNavigationContainerRef: () => {
      mockNavigationRef = actual.useNavigationContainerRef();
      return mockNavigationRef;
    }
  };
});

jest.mock("@/features/splash", () => ({
  SplashScreen: function Entry() {
    const { useNavigation } = jest.requireActual("@react-navigation/native");
    const { Button } = jest.requireActual("@/components/ui");
    const navigation = useNavigation();
    return <Button label="Open profile" onPress={() => navigation.navigate("Profile")} />;
  }
}));
jest.mock("@/services/storage", () => ({
  secureStorage: {
    getItem: jest.fn().mockResolvedValue(null),
    removeItem: jest.fn().mockResolvedValue(undefined),
    setItem: jest.fn()
  }
}));

beforeEach(async () => {
  await i18n.changeLanguage("pt-BR");
  queryClient.clear();
  jest.clearAllMocks();
  jest.spyOn(service, "getSettings").mockResolvedValue({ is_private: true, language: "pt-BR" });
  jest.spyOn(musicApi, "getMusicPreferences").mockResolvedValue({
    artists: [
      { id: 10, name: "Artist One" },
      { id: 20, name: "Artist Two" },
      { id: 30, name: "Artist Three" }
    ],
    genres: [
      { id: 110, name: "Genre One" },
      { id: 120, name: "Genre Two" },
      { id: 130, name: "Genre Three" }
    ],
    track: { id: 1, title: "Saved song", artist: "Saved artist" }
  });
});
afterEach(() => {
  cleanup();
  queryClient.clear();
  jest.restoreAllMocks();
});

it("opens Settings through the profile gear and navigates to every destination", async () => {
  render(
    <AppProviders>
      <RootNavigator />
    </AppProviders>
  );
  fireEvent.press(screen.getByRole("button", { name: "Open profile" }));
  fireEvent.press(await screen.findByRole("button", { name: "Configurações" }));
  expect(await screen.findByTestId("settings-screen")).toBeTruthy();
  fireEvent.press(await screen.findByText("Minha conta"));
  expect(await screen.findByTestId("account-screen")).toBeTruthy();
  fireEvent.press(screen.getByRole("button", { name: "Voltar" }));
  expect(await screen.findByTestId("settings-screen")).toBeTruthy();
  fireEvent.press(await screen.findByText("Preferências musicais"));
  expect(await screen.findByTestId("onboarding-artists-screen")).toBeTruthy();
  fireEvent.press(screen.getByRole("button", { name: "Voltar" }));
  expect(await screen.findByTestId("settings-screen")).toBeTruthy();
  fireEvent.press(await screen.findByText("Idioma"));
  expect(await screen.findByTestId("language-settings-screen")).toBeTruthy();
  fireEvent.press(screen.getByRole("button", { name: "Voltar" }));
  expect(await screen.findByTestId("settings-screen")).toBeTruthy();
  fireEvent.press(screen.getByRole("button", { name: "Voltar" }));
  expect(await screen.findByTestId("profile-screen")).toBeTruthy();
});

it("signs out from Settings, clears private data and removes logged-in routes from history", async () => {
  queryClient.setQueryData(AUTH_ME_QUERY_KEY, { user_id: "example" });
  queryClient.setQueryData(["profile", "example"], { name: "Previous account" });
  render(
    <AppProviders>
      <RootNavigator />
    </AppProviders>
  );
  fireEvent.press(screen.getByRole("button", { name: "Open profile" }));
  fireEvent.press(await screen.findByRole("button", { name: "Configurações" }));
  await screen.findByRole("switch");
  fireEvent.press(screen.getByRole("button", { name: "Sair" }));
  await act(async () =>
    fireEvent.press(
      within(screen.getByTestId("sign-out-dialog")).getByRole("button", { name: "Sair" })
    )
  );
  expect(await screen.findByTestId("sign-in-screen")).toBeTruthy();
  expect(secureStorage.removeItem).toHaveBeenCalledWith("auth_token");
  expect(queryClient.getQueryData(SETTINGS_QUERY_KEY)).toBeUndefined();
  expect(queryClient.getQueryData(AUTH_ME_QUERY_KEY)).toBeUndefined();
  expect(queryClient.getQueryData(["profile", "example"])).toBeUndefined();
  expect(mockNavigationRef.getRootState()?.routes.map((route) => route.name)).toEqual(["Login"]);
  expect(mockNavigationRef.canGoBack()).toBe(false);
});
