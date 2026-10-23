import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import { I18nextProvider } from "react-i18next";
import { i18n } from "@/i18n";
import { QueryClientProvider } from "@tanstack/react-query";
import { PaperProvider } from "react-native-paper";

import { queryClient } from "@/app/providers/queryClient";
import { AdminHomeScreen } from "@/features/admin/screens/AdminHomeScreen";
import { AdminPendingScreen } from "@/features/admin/screens/AdminPendingScreen";
import { AUTH_ME_QUERY_KEY } from "@/features/auth/api/getCurrentUser";
import { clearSession } from "@/features/auth/session";
import { paperTheme } from "@/theme";

import { SessionProviders } from "../../providers/SessionProviders";

const mockNavigate = jest.fn();
const mockReset = jest.fn();
jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual("@react-navigation/native"),
  useNavigation: () => ({ navigate: mockNavigate, reset: mockReset })
}));
jest.mock("@/features/auth/session", () => ({
  ...jest.requireActual("@/features/auth/session"),
  clearSession: jest.fn(async () => undefined)
}));

function renderHome(pending = false) {
  return render(
    <QueryClientProvider client={queryClient}>
      <I18nextProvider i18n={i18n}>
        <PaperProvider theme={paperTheme}>
          <SessionProviders>
            {pending ? (
              <AdminPendingScreen activeTab="users" title="Gestão de usuários" />
            ) : (
              <AdminHomeScreen />
            )}
          </SessionProviders>
        </PaperProvider>
      </I18nextProvider>
    </QueryClientProvider>
  );
}

describe("AdminHomeScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    queryClient.clear();
    queryClient.setQueryData(AUTH_ME_QUERY_KEY, {
      user_id: "admin-1",
      username: "admin",
      role: "ADMIN"
    });
  });
  afterEach(() => {
    cleanup();
    queryClient.clear();
  });

  it("shows the required home title, cached username and three administrative entries", () => {
    renderHome();
    expect(screen.getByText("Área administrativa")).toBeTruthy();
    expect(screen.getByText("@admin")).toBeTruthy();
    for (const [label, route] of [
      ["Denúncias", "AdminReports"],
      ["Usuários", "AdminUsers"],
      ["Auditoria", "AdminAuditLog"]
    ]) {
      fireEvent.press(screen.getByRole("button", { name: label }));
      expect(mockNavigate).toHaveBeenCalledWith(route);
    }
    for (const label of ["Feed", "Perfil", "Câmera"]) expect(screen.queryByText(label)).toBeNull();
    act(() => {
      queryClient.setQueryData(AUTH_ME_QUERY_KEY, { username: "renamed", role: "ADMIN" });
    });
    expect(screen.getByText("@renamed")).toBeTruthy();
  });

  it("allows returning from a pending screen without navigating to the common app", () => {
    renderHome(true);
    fireEvent.press(screen.getByRole("button", { name: "Início administrativo" }));
    expect(mockNavigate).toHaveBeenCalledWith("Admin");
    fireEvent.press(screen.getByRole("tab", { name: "Auditoria" }));
    expect(mockNavigate).toHaveBeenCalledWith("AdminAuditLog");
  });

  it("signs out only once even on repeated taps", async () => {
    renderHome();
    const signOut = screen.getByRole("button", { name: "Sair" });
    fireEvent.press(signOut);
    fireEvent.press(signOut);
    await waitFor(() =>
      expect(mockReset).toHaveBeenCalledWith({ index: 0, routes: [{ name: "Login" }] })
    );
    expect(clearSession).toHaveBeenCalledTimes(1);
  });
});
