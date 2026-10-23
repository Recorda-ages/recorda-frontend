import { notifyManager, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within
} from "@testing-library/react-native";
import { I18nextProvider } from "react-i18next";

import { SettingsScreen } from "@/features/settings";
import { AUTH_ME_QUERY_KEY } from "@/features/auth/api/getCurrentUser";
import { SETTINGS_QUERY_KEY } from "@/features/settings/queryKeys";
import * as service from "@/features/settings/services/settingsService";
import type { SettingsUpdateResponse, UserSettings } from "@/features/settings/types";
import { i18n } from "@/i18n";

notifyManager.setScheduler((cb) => cb());
const mockNavigate = jest.fn();
const mockGoBack = jest.fn();
jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual("@react-navigation/native"),
  useNavigation: () => ({ navigate: mockNavigate, goBack: mockGoBack })
}));

let queryClient: QueryClient;
let serverSettings: UserSettings;
let get: jest.SpyInstance;
let patch: jest.SpyInstance;
const signOut = jest.fn();

function renderScreen(cached?: UserSettings) {
  queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: Infinity, staleTime: 30_000 },
      mutations: { retry: false }
    }
  });
  if (cached) queryClient.setQueryData(SETTINGS_QUERY_KEY, cached);
  queryClient.setQueryData(AUTH_ME_QUERY_KEY, { user_id: "test-user" });
  return render(
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={queryClient}>
        <SettingsScreen onSignOut={signOut} />
      </QueryClientProvider>
    </I18nextProvider>
  );
}

async function ready() {
  await waitFor(() => expect(screen.getByRole("switch")).toBeEnabled());
}

function toggle(value: boolean) {
  fireEvent(screen.getByRole("switch"), "valueChange", value);
}

beforeEach(async () => {
  await i18n.changeLanguage("pt-BR");
  mockNavigate.mockReset();
  mockGoBack.mockReset();
  signOut.mockReset();
  signOut.mockResolvedValue(undefined);
  serverSettings = { is_private: false, language: "pt-BR" };
  get = jest.spyOn(service, "getSettings").mockImplementation(async () => ({ ...serverSettings }));
  patch = jest.spyOn(service, "updateSettings").mockImplementation(async (partial) => {
    serverSettings = { ...serverSettings, ...partial };
    return { ...serverSettings, accepted_requests: 0 };
  });
});
afterEach(() => {
  cleanup();
  queryClient.clear();
  jest.restoreAllMocks();
});

it.each([true, false])(
  "loads the real server privacy value %s instead of a default",
  async (isPrivate) => {
    serverSettings.is_private = isPrivate;
    renderScreen();
    await ready();
    expect(screen.getByRole("switch")).toHaveProp("value", isPrivate);
    expect(
      screen.getByText(
        isPrivate
          ? "Só seguidores aprovados veem suas Recordas"
          : "Qualquer pessoa vê suas Recordas"
      )
    ).toBeTruthy();
  }
);

it("refetches stale cached settings and disables edits until the server responds", async () => {
  let resolve!: (value: UserSettings) => void;
  get.mockImplementation(
    () =>
      new Promise<UserSettings>((r) => {
        resolve = r;
      })
  );
  renderScreen({ is_private: false, language: "pt-BR" });
  expect(screen.getByRole("switch")).toBeDisabled();
  await act(async () => resolve({ is_private: true, language: "pt-BR" }));
  await ready();
  expect(screen.getByRole("switch")).toHaveProp("value", true);
});

it("confirms public to private with retroactive visibility and retains the value on cancel", async () => {
  renderScreen();
  await ready();
  toggle(true);
  expect(screen.getByText("Tornar a conta privada?")).toBeTruthy();
  expect(screen.getByText(/inclusive as antigas.*seguidores aprovados/)).toBeTruthy();
  expect(patch).not.toHaveBeenCalled();
  expect(screen.getByRole("switch")).toHaveProp("value", false);
  fireEvent.press(screen.getByRole("button", { name: "Cancelar" }));
  expect(screen.queryByText("Tornar a conta privada?")).toBeNull();
  expect(patch).not.toHaveBeenCalled();
  toggle(true);
  fireEvent.press(screen.getByRole("button", { name: "Confirmar" }));
  await waitFor(() => expect(patch).toHaveBeenCalledWith({ is_private: true }, expect.anything()));
  expect(screen.getByRole("switch")).toHaveProp("value", true);
});

it.each([0, 1, 3])("confirms private to public and reports %s accepted requests", async (count) => {
  serverSettings.is_private = true;
  patch.mockImplementation(async () => ({
    is_private: false,
    language: "pt-BR",
    accepted_requests: count
  }));
  renderScreen();
  await ready();
  toggle(false);
  expect(screen.getByText("Tornar a conta pública?")).toBeTruthy();
  expect(screen.getByText(/inclusive as antigas.*pedidos pendentes.*serão aceitos/)).toBeTruthy();
  expect(patch).not.toHaveBeenCalled();
  fireEvent.press(screen.getByRole("button", { name: "Confirmar" }));
  await waitFor(() => expect(screen.getByRole("switch")).toHaveProp("value", false));
  if (count > 0)
    expect(
      await screen.findByText(count === 1 ? "1 pedido foi aceito" : "3 pedidos foram aceitos")
    ).toBeTruthy();
  else expect(screen.queryByText(/pedidos foram aceitos/)).toBeNull();
});

it.each([true, false])(
  "updates optimistically, blocks concurrent edits, and rolls back a failed transition to %s",
  async (target) => {
    serverSettings.is_private = !target;
    let reject!: (error: Error) => void;
    patch.mockImplementation(
      () =>
        new Promise<SettingsUpdateResponse>((_r, fail) => {
          reject = fail;
        })
    );
    renderScreen();
    await ready();
    toggle(target);
    fireEvent.press(screen.getByRole("button", { name: "Confirmar" }));
    await waitFor(() => expect(patch).toHaveBeenCalledTimes(1));
    expect(screen.getByRole("switch")).toHaveProp("value", target);
    expect(screen.getByRole("switch")).toBeDisabled();
    expect(screen.getByRole("button", { name: "Sair" })).toBeDisabled();
    await act(async () => reject(new Error("offline")));
    await waitFor(() => expect(screen.getByRole("switch")).toHaveProp("value", !target));
    expect(screen.getByText(/Sua configuração anterior foi restaurada/)).toBeTruthy();
    toggle(target);
    expect(screen.queryByText(/Sua configuração anterior foi restaurada/)).toBeNull();
  }
);

it("invalidates profile, feed and notifications only after successful persistence", async () => {
  renderScreen();
  await ready();
  const invalidate = jest.spyOn(queryClient, "invalidateQueries");
  toggle(true);
  fireEvent.press(screen.getByRole("button", { name: "Confirmar" }));
  await waitFor(() => expect(invalidate).toHaveBeenCalledTimes(3));
  for (const queryKey of [["profile"], ["feed"], ["notifications"]])
    expect(invalidate).toHaveBeenCalledWith({ queryKey });
});

it("keeps privacy edits blocked after leaving and reopening while a save is pending", async () => {
  let finish!: (response: SettingsUpdateResponse) => void;
  patch.mockImplementation(
    () =>
      new Promise<SettingsUpdateResponse>((resolve) => {
        finish = resolve;
      })
  );
  const firstVisit = renderScreen();
  await ready();
  toggle(true);
  fireEvent.press(screen.getByRole("button", { name: "Confirmar" }));
  await waitFor(() => expect(patch).toHaveBeenCalledTimes(1));
  firstVisit.unmount();
  get.mockClear();
  render(
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={queryClient}>
        <SettingsScreen onSignOut={signOut} />
      </QueryClientProvider>
    </I18nextProvider>
  );
  expect(screen.getByRole("switch")).toBeDisabled();
  expect(screen.getByText("Salvando privacidade…")).toBeTruthy();
  expect(get).not.toHaveBeenCalled();
  await act(async () => {
    serverSettings.is_private = true;
    finish({ ...serverSettings, accepted_requests: 0 });
  });
  await ready();
  expect(screen.getByRole("switch")).toHaveProp("value", true);
  expect(patch).toHaveBeenCalledTimes(1);
});

it("shows loading, handles failure without inventing privacy, and allows retry", async () => {
  get.mockRejectedValueOnce(new Error("offline"));
  renderScreen();
  expect(screen.getByText("Carregando configurações…")).toBeTruthy();
  expect(await screen.findByText("Não foi possível carregar suas configurações.")).toBeTruthy();
  expect(screen.queryByRole("switch")).toBeNull();
  fireEvent.press(screen.getByRole("button", { name: "Tentar novamente" }));
  await ready();
});

it("opens the account, music and language destinations and goes back", async () => {
  renderScreen();
  await ready();
  for (const [name, destination] of [
    ["Minha conta", "account"],
    ["Preferências musicais", "music"],
    ["Idioma", "language"]
  ]) {
    fireEvent.press(screen.getByText(name));
    expect(mockNavigate).toHaveBeenCalledWith("SettingsPending", { destination });
  }
  fireEvent.press(screen.getByRole("button", { name: "Voltar" }));
  expect(mockGoBack).toHaveBeenCalled();
});

it("cancels sign out and signs out only after confirmation", async () => {
  renderScreen();
  await ready();
  fireEvent.press(screen.getByRole("button", { name: "Sair" }));
  expect(screen.getByText("Deseja sair da sua conta?")).toBeTruthy();
  expect(signOut).not.toHaveBeenCalled();
  fireEvent.press(screen.getByRole("button", { name: "Cancelar" }));
  expect(signOut).not.toHaveBeenCalled();
  fireEvent.press(screen.getByRole("button", { name: "Sair" }));
  fireEvent.press(
    within(screen.getByTestId("sign-out-dialog")).getByRole("button", { name: "Sair" })
  );
  await waitFor(() => expect(signOut).toHaveBeenCalledTimes(1));
});

it("handles sign out failure and re-enables the actions", async () => {
  signOut.mockRejectedValueOnce(new Error("failed"));
  renderScreen();
  await ready();
  fireEvent.press(screen.getByRole("button", { name: "Sair" }));
  fireEvent.press(
    within(screen.getByTestId("sign-out-dialog")).getByRole("button", { name: "Sair" })
  );
  expect(await screen.findByText("Não foi possível sair. Tente novamente.")).toBeTruthy();
  expect(screen.getByRole("button", { name: "Sair" })).toBeEnabled();
});

it.each([
  ["en", "Settings", "Private account"],
  ["es", "Configuración", "Cuenta privada"]
])("translates settings into %s", async (language, title, label) => {
  await i18n.changeLanguage(language);
  renderScreen();
  await ready();
  expect(screen.getByText(title)).toBeTruthy();
  expect(screen.getByRole("switch", { name: label })).toBeTruthy();
});
