import { act, cleanup, fireEvent, render, screen } from "@testing-library/react-native";

import { RootNavigator } from "@/app/navigation/RootNavigator";
import { AppProviders } from "@/app/providers/AppProviders";
import { queryClient } from "@/app/providers/queryClient";
import { AUTH_ME_QUERY_KEY } from "@/features/auth/api/getCurrentUser";
import { SETTINGS_QUERY_KEY } from "@/features/settings/queryKeys";
import * as service from "@/features/settings/services/settingsService";
import { i18n } from "@/i18n";
import { secureStorage } from "@/services/storage";

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
});
afterEach(() => {
  cleanup();
  queryClient.clear();
  jest.restoreAllMocks();
});

it("opens Settings through the profile gear and navigates to every pending destination", async () => {
  render(
    <AppProviders>
      <RootNavigator />
    </AppProviders>
  );
  fireEvent.press(screen.getByRole("button", { name: "Open profile" }));
  fireEvent.press(await screen.findByRole("button", { name: "Configurações" }));
  expect(await screen.findByTestId("settings-screen")).toBeTruthy();
  for (const name of ["Minha conta", "Preferências musicais", "Idioma"]) {
    fireEvent.press(await screen.findByText(name));
    expect(
      await screen.findByText(
        "Esta configuração está em construção. Em breve você poderá alterá-la aqui."
      )
    ).toBeTruthy();
    fireEvent.press(screen.getByRole("button", { name: "Voltar" }));
    expect(await screen.findByTestId("settings-screen")).toBeTruthy();
  }
  fireEvent.press(screen.getByRole("button", { name: "Voltar" }));
  expect(await screen.findByTestId("profile-screen")).toBeTruthy();
});

it("signs out from Settings, clears settings and session, and returns to login", async () => {
  queryClient.setQueryData(AUTH_ME_QUERY_KEY, { user_id: "example" });
  render(
    <AppProviders>
      <RootNavigator />
    </AppProviders>
  );
  fireEvent.press(screen.getByRole("button", { name: "Open profile" }));
  fireEvent.press(await screen.findByRole("button", { name: "Configurações" }));
  await screen.findByRole("switch");
  fireEvent.press(screen.getByRole("button", { name: "Sair" }));
  await act(async () => fireEvent.press(screen.getByRole("button", { name: "Confirmar" })));
  expect(await screen.findByTestId("sign-in-screen")).toBeTruthy();
  expect(secureStorage.removeItem).toHaveBeenCalledWith("auth_token");
  expect(queryClient.getQueryData(SETTINGS_QUERY_KEY)).toBeUndefined();
  expect(queryClient.getQueryData(AUTH_ME_QUERY_KEY)).toBeUndefined();
});
