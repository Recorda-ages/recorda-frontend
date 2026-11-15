import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import { I18nextProvider } from "react-i18next";
import { i18n } from "@/i18n";
import { QueryClientProvider } from "@tanstack/react-query";
import { PaperProvider } from "react-native-paper";

import { queryClient } from "@/app/providers/queryClient";
import { AdminScreenLayout } from "@/features/admin/components/AdminScreenLayout";
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

function renderLayout(back?: { label: string; onPress: () => void }) {
  return render(
    <QueryClientProvider client={queryClient}>
      <I18nextProvider i18n={i18n}>
        <PaperProvider theme={paperTheme}>
          <SessionProviders>
            <AdminScreenLayout activeTab="reports" back={back} title="Denúncias" />
          </SessionProviders>
        </PaperProvider>
      </I18nextProvider>
    </QueryClientProvider>
  );
}

describe("AdminScreenLayout", () => {
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

  it("shows the title and the cached username", () => {
    renderLayout();

    expect(screen.getByText("Denúncias")).toBeTruthy();
    expect(screen.getByText("@admin")).toBeTruthy();
    act(() => {
      queryClient.setQueryData(AUTH_ME_QUERY_KEY, { username: "renamed", role: "ADMIN" });
    });
    expect(screen.getByText("@renamed")).toBeTruthy();
  });

  it("offers the same three admin tabs on every screen, and nothing from the common app", () => {
    renderLayout();

    expect(screen.getAllByRole("tab")).toHaveLength(3);
    for (const [label, route] of [
      ["Denúncias", "AdminReports"],
      ["Usuários", "AdminUsers"],
      ["Auditoria", "AdminAuditLog"]
    ]) {
      fireEvent.press(screen.getByRole("tab", { name: label }));
      expect(mockNavigate).toHaveBeenCalledWith(route);
    }
    for (const label of ["Feed", "Perfil", "Câmera"]) expect(screen.queryByText(label)).toBeNull();
  });

  it("has no back button on a tab screen", () => {
    renderLayout();

    expect(screen.queryByRole("button", { name: "Voltar" })).toBeNull();
  });

  it("goes back from an inner screen", () => {
    const onBack = jest.fn();
    renderLayout({ label: "Voltar", onPress: onBack });

    fireEvent.press(screen.getByRole("button", { name: "Voltar" }));

    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it("signs out only once even on repeated taps", async () => {
    renderLayout();
    const signOut = screen.getByRole("button", { name: "Sair" });
    fireEvent.press(signOut);
    fireEvent.press(signOut);
    await waitFor(() =>
      expect(mockReset).toHaveBeenCalledWith({ index: 0, routes: [{ name: "Login" }] })
    );
    expect(clearSession).toHaveBeenCalledTimes(1);
  });
});
