import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import { I18nextProvider } from "react-i18next";
import { PaperProvider } from "react-native-paper";

import { queryClient } from "@/app/providers/queryClient";
import { useAdminReports } from "@/features/admin/hooks/useAdminReports";
import { AdminHomeScreen } from "@/features/admin/screens/AdminHomeScreen";
import type { AdminReportGroup } from "@/features/admin/types";
import { AUTH_ME_QUERY_KEY } from "@/features/auth/api/getCurrentUser";
import { clearSession } from "@/features/auth/session";
import { i18n } from "@/i18n";
import { paperTheme } from "@/theme";

const mockNavigate = jest.fn();
const mockReset = jest.fn();
const mockRefetch = jest.fn();

jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual("@react-navigation/native"),
  useNavigation: () => ({ navigate: mockNavigate, reset: mockReset })
}));

jest.mock("@/features/admin/hooks/useAdminReports", () => ({
  useAdminReports: jest.fn()
}));

jest.mock("@/features/auth/session", () => ({
  ...jest.requireActual("@/features/auth/session"),
  clearSession: jest.fn(async () => undefined)
}));

const mockUseAdminReports = useAdminReports as jest.Mock;
const mockClearSession = clearSession as jest.Mock;

const REPORTS: AdminReportGroup[] = [
  {
    contentSummary: "Erro ao postar Recorda",
    latestReportedAt: "2026-10-08T12:00:00Z",
    latestReporterUsername: "paulo",
    openReportCount: 3,
    status: "OPEN",
    targetId: "recorda-1",
    targetLabel: "Post de @marina",
    targetType: "RECORDA",
    targetUsername: "marina"
  },
  {
    contentSummary: "Perfil denunciado",
    latestReportedAt: "2026-10-09T12:00:00Z",
    latestReporterUsername: "bia",
    openReportCount: 4,
    status: "RESOLVED",
    targetId: "user-2",
    targetLabel: "@usuario2",
    targetType: "USER",
    targetUsername: "usuario2"
  }
];

function successfulQuery(items = REPORTS) {
  return {
    data: { items, nextCursor: null },
    error: null,
    isError: false,
    isPending: false,
    isSuccess: true,
    refetch: mockRefetch
  };
}

function renderScreen() {
  return render(
    <I18nextProvider i18n={i18n}>
      <PaperProvider theme={paperTheme}>
        <AdminHomeScreen />
      </PaperProvider>
    </I18nextProvider>
  );
}

describe("AdminHomeScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    queryClient.clear();
    queryClient.setQueryData(AUTH_ME_QUERY_KEY, {
      name: "Admin Recorda",
      onboarding_completed: true,
      role: "ADMIN",
      user_id: "admin-1",
      username: "admin"
    });
    mockUseAdminReports.mockReturnValue(successfulQuery());
  });

  afterEach(() => queryClient.clear());

  it("renders the reports home with the cached admin and no common-app links", () => {
    renderScreen();

    expect(screen.getByText("Denúncias")).toBeTruthy();
    expect(screen.getByText("@admin")).toBeTruthy();
    expect(screen.getByText("2 denúncias agrupadas")).toBeTruthy();
    expect(screen.getByText("@marina — Erro ao postar Recorda")).toBeTruthy();
    expect(screen.getByText("@usuario2 — Perfil denunciado")).toBeTruthy();
    expect(screen.getByRole("radio", { name: "Todos os tipos" })).toBeTruthy();
    expect(screen.getByRole("radio", { name: "Todos os status" })).toBeTruthy();
    expect(screen.queryByText("Feed")).toBeNull();
    expect(screen.queryByText("Perfil")).toBeNull();
    expect(screen.queryByText("Câmera")).toBeNull();
  });

  it("sends search and selected filters to the reports hook", () => {
    renderScreen();

    fireEvent.changeText(screen.getByLabelText("Buscar por usuário ou conteúdo"), "marina");
    fireEvent.press(screen.getByRole("radio", { name: "Recordas" }));
    fireEvent.press(screen.getByRole("radio", { name: "Resolvidas" }));

    expect(mockUseAdminReports).toHaveBeenLastCalledWith({
      query: "marina",
      status: "RESOLVED",
      targetType: "RECORDA"
    });
  });

  it("opens the report target detail with its typed params", () => {
    renderScreen();

    fireEvent.press(screen.getByRole("button", { name: "Abrir denúncias de @marina" }));

    expect(mockNavigate).toHaveBeenCalledWith("AdminReportDetail", {
      targetId: "recorda-1",
      targetType: "RECORDA"
    });
  });

  it("navigates only within the administrative bottom navigation", () => {
    renderScreen();

    fireEvent.press(screen.getByRole("tab", { name: "Usuários" }));
    expect(mockNavigate).toHaveBeenCalledWith("AdminUsers");
    expect(screen.getByRole("tab", { name: "Denúncias" }).props.accessibilityState).toMatchObject({
      selected: true
    });
  });

  it("clears the session and resets to Login on logout", async () => {
    renderScreen();

    fireEvent.press(screen.getByRole("button", { name: "Sair" }));

    await waitFor(() => expect(mockClearSession).toHaveBeenCalledTimes(1));
    expect(mockReset).toHaveBeenCalledWith({ index: 0, routes: [{ name: "Login" }] });
  });

  it("shows loading, empty and retryable error states", () => {
    mockUseAdminReports.mockReturnValueOnce({
      ...successfulQuery([]),
      isPending: true,
      isSuccess: false
    });
    const view = renderScreen();
    expect(screen.getByText("Carregando denúncias")).toBeTruthy();

    mockUseAdminReports.mockReturnValueOnce(successfulQuery([]));
    view.rerender(
      <I18nextProvider i18n={i18n}>
        <PaperProvider theme={paperTheme}>
          <AdminHomeScreen />
        </PaperProvider>
      </I18nextProvider>
    );
    expect(screen.getByText("Nenhuma denúncia encontrada.")).toBeTruthy();

    mockUseAdminReports.mockReturnValueOnce({
      ...successfulQuery([]),
      error: new Error("offline"),
      isError: true,
      isSuccess: false
    });
    view.rerender(
      <I18nextProvider i18n={i18n}>
        <PaperProvider theme={paperTheme}>
          <AdminHomeScreen />
        </PaperProvider>
      </I18nextProvider>
    );
    fireEvent.press(screen.getByRole("button", { name: "Tentar novamente" }));
    expect(mockRefetch).toHaveBeenCalledTimes(1);
  });
});
