import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react-native";
import { Alert } from "react-native";
import { I18nextProvider } from "react-i18next";
import { PaperProvider } from "react-native-paper";

import { ADMIN_REPORTS_QUERY_KEY } from "@/features/admin/reports/hooks/useAdminReportGroups";
import { AdminReportDetailScreen } from "@/features/admin/reports/screens/AdminReportDetailScreen";
import {
  adminServiceMock,
  resetAdminServiceMock
} from "@/features/admin/services/adminService.mock";
import type { AdminTargetType } from "@/features/admin/types";
import { AUTH_ME_QUERY_KEY } from "@/features/auth/api/getCurrentUser";
import { clearSession } from "@/features/auth/session";
import { i18n } from "@/i18n";
import { ApiError, AUTH_TOKEN_QUERY_KEY } from "@/services/api";
import { ToastProvider } from "@/components/ui/ToastProvider";
import { paperTheme } from "@/theme";

import { mockUseVideoPlayer, resetVideoMock } from "../../mocks/expoVideo";

const mockNavigate = jest.fn();
const mockReset = jest.fn();
const mockGoBack = jest.fn();
const mockCanGoBack = jest.fn(() => true);

jest.mock("@/features/admin/services/adminAdapter", () => ({
  adminAdapter: jest.requireActual("@/features/admin/services/adminService.mock").adminServiceMock
}));

jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual("@react-navigation/native"),
  useNavigation: () => ({
    canGoBack: mockCanGoBack,
    goBack: mockGoBack,
    navigate: mockNavigate,
    reset: mockReset
  })
}));

jest.mock("@/features/auth/session", () => ({
  ...jest.requireActual("@/features/auth/session"),
  clearSession: jest.fn(async () => undefined)
}));

const mockClearSession = clearSession as jest.Mock;

function renderDetail(targetType: AdminTargetType, targetId: string) {
  const client = new QueryClient({
    defaultOptions: { mutations: { gcTime: Infinity }, queries: { gcTime: Infinity } }
  });
  client.setQueryData(AUTH_TOKEN_QUERY_KEY, null);
  client.setQueryData(AUTH_ME_QUERY_KEY, {
    name: "Admin Recorda",
    onboarding_completed: true,
    role: "ADMIN",
    user_id: "admin-1",
    username: "admin"
  });

  render(
    <QueryClientProvider client={client}>
      <I18nextProvider i18n={i18n}>
        <PaperProvider theme={paperTheme}>
          <ToastProvider>
            <AdminReportDetailScreen targetId={targetId} targetType={targetType} />
          </ToastProvider>
        </PaperProvider>
      </I18nextProvider>
    </QueryClientProvider>
  );

  return client;
}

async function chooseStatusAction(label: string, reason: string) {
  fireEvent.press(await screen.findByRole("button", { name: label }));
  fireEvent.changeText(screen.getByLabelText("Motivo"), reason);
}

describe("AdminReportDetailScreen", () => {
  beforeEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
    mockCanGoBack.mockReturnValue(true);
    resetAdminServiceMock();
    resetVideoMock();
  });

  it("shows the complete reported Recorda with its music, reports and actions", async () => {
    renderDetail("RECORDA", "recorda-1042");

    expect(await screen.findByText("RECORDA DENUNCIADA")).toBeTruthy();
    expect(screen.getByText("@marina")).toBeTruthy();
    expect(screen.getByLabelText("Foto da Recorda de @marina")).toBeTruthy();
    expect(
      screen.getByText("Um passeio depois da chuva, guardado ao som de uma música especial.")
    ).toBeTruthy();
    expect(screen.getByText("Levitating")).toBeTruthy();
    expect(screen.getByText("Dua Lipa")).toBeTruthy();
    expect(screen.getByTestId("admin-report-song-cover")).toBeTruthy();
    expect(screen.queryByTestId("admin-report-removed")).toBeNull();

    const summary = screen.getByTestId("admin-report-detail-summary");
    expect(within(summary).getByText("PENDENTE")).toBeTruthy();
    expect(within(summary).getByText("3 denúncias")).toBeTruthy();

    expect(screen.getByText("Denúncias (3)")).toBeTruthy();
    const firstReport = screen.getByTestId("admin-report-entry-report-1");
    expect(within(firstReport).getByText("@paulo")).toBeTruthy();
    expect(
      within(firstReport).getByText("A legenda tem ofensas contra outra pessoa.")
    ).toBeTruthy();
    expect(within(firstReport).getByText("Pendente")).toBeTruthy();
    expect(within(firstReport).getByText(/^05\/10\/2026 às \d{2}:\d{2}$/)).toBeTruthy();
    expect(
      within(screen.getByTestId("admin-report-entry-report-2")).getByText("Sem descrição")
    ).toBeTruthy();

    expect(screen.getByText("Nenhuma ação registrada.")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Marcar como resolvida" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Descartar denúncia" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Reabrir denúncias" })).toBeNull();
    expect(screen.queryByTestId("admin-report-open-user")).toBeNull();
  });

  it("plays a removed Recorda video only on demand and without sound", async () => {
    renderDetail("RECORDA", "recorda-1124");

    expect(await screen.findByTestId("admin-report-video")).toBeTruthy();
    expect(screen.getByText("Removida em 02/10/2026")).toBeTruthy();

    const player = mockUseVideoPlayer.mock.results.at(-1)?.value;
    expect(mockUseVideoPlayer).toHaveBeenLastCalledWith(
      { uri: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4" },
      expect.any(Function)
    );
    expect(player.muted).toBe(true);
    expect(player.play).not.toHaveBeenCalled();
  });

  it("shows the reported profile and opens the user administration", async () => {
    renderDetail("USER", "user-1088");

    expect(await screen.findByText("PERFIL DENUNCIADO")).toBeTruthy();
    expect(screen.getByText("@usuario2")).toBeTruthy();
    expect(screen.getByText("Usuário Dois")).toBeTruthy();
    expect(screen.getByText("usuario2@example.com")).toBeTruthy();
    expect(screen.getByText("Suspenso")).toBeTruthy();
    expect(screen.getByText("Conta criada em 14/03/2025 • Conta privada")).toBeTruthy();
    expect(screen.getByTestId("admin-report-avatar-fallback")).toBeTruthy();
    expect(screen.getByText("Conta suspensa")).toBeTruthy();
    expect(screen.getByText("Motivo: Perfil usado para divulgar golpes.")).toBeTruthy();
    expect(screen.getByText(/^Por @moderador • 04\/10\/2026 às \d{2}:\d{2}$/)).toBeTruthy();

    fireEvent.press(screen.getByRole("button", { name: "Abrir usuário" }));

    expect(mockNavigate).toHaveBeenCalledWith("AdminUserDetail", { userId: "user-1088" });
  });

  it("only offers to reopen reports that were already closed", async () => {
    renderDetail("USER", "user-1201");

    expect(await screen.findByRole("button", { name: "Reabrir denúncias" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Marcar como resolvida" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Descartar denúncia" })).toBeNull();
    expect(screen.getByText("Denúncias marcadas como resolvidas")).toBeTruthy();
  });

  it("dismisses the reports with a reason and refreshes the detail and the list", async () => {
    const update = jest.spyOn(adminServiceMock, "updateReportStatus");
    const client = renderDetail("RECORDA", "recorda-1042");
    const invalidate = jest.spyOn(client, "invalidateQueries");

    fireEvent.press(await screen.findByRole("button", { name: "Descartar denúncia" }));
    expect(screen.getByText("Descartar denúncias")).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "Descartar" }).props.accessibilityState
    ).toMatchObject({ disabled: true });

    fireEvent.changeText(screen.getByLabelText("Motivo"), "  Não viola as regras.  ");
    fireEvent.press(screen.getByRole("button", { name: "Descartar" }));

    expect(await screen.findByText("Denúncias descartadas.")).toBeTruthy();
    expect(update).toHaveBeenCalledWith("RECORDA", "recorda-1042", {
      reason: "Não viola as regras.",
      status: "DISMISSED"
    });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ADMIN_REPORTS_QUERY_KEY });
    expect(await screen.findByText("Motivo: Não viola as regras.")).toBeTruthy();
    expect(screen.getAllByText("Descartada")).toHaveLength(3);
    expect(screen.getByRole("button", { name: "Reabrir denúncias" })).toBeTruthy();
    expect(screen.queryByText("Descartar denúncias")).toBeNull();

    const list = await adminServiceMock.listReportGroups({ status: "DISMISSED" });
    expect(list.items.map((group) => group.targetId)).toContain("recorda-1042");
  });

  it("reopens closed reports", async () => {
    renderDetail("RECORDA", "recorda-1300");

    await chooseStatusAction("Reabrir denúncias", "Novo contexto apareceu.");
    fireEvent.press(screen.getByRole("button", { name: "Reabrir" }));

    expect(await screen.findByText("Denúncias reabertas.")).toBeTruthy();
    expect(await screen.findByRole("button", { name: "Marcar como resolvida" })).toBeTruthy();
    expect(screen.getByText("Denúncias reabertas")).toBeTruthy();
  });

  it("warns about a conflict and reloads when someone else already changed the reports", async () => {
    const alert = jest.spyOn(Alert, "alert").mockImplementation(() => undefined);
    jest
      .spyOn(adminServiceMock, "updateReportStatus")
      .mockRejectedValueOnce(new ApiError("CONFLICT", "conflict", 409, null));
    const detail = jest.spyOn(adminServiceMock, "getReportDetail");
    renderDetail("RECORDA", "recorda-1042");

    await chooseStatusAction("Marcar como resolvida", "Confirmado.");
    fireEvent.press(screen.getByRole("button", { name: "Resolver" }));

    await waitFor(() =>
      expect(alert).toHaveBeenCalledWith(
        "Este conteúdo já foi tratado",
        "Essas denúncias foram alteradas por outra pessoa. Os dados foram recarregados."
      )
    );
    await waitFor(() => expect(detail).toHaveBeenCalledTimes(2));
    expect(screen.queryByText("Marcar denúncias como resolvidas")).toBeNull();
    expect(screen.queryByText("Denúncias marcadas como resolvidas.")).toBeNull();
  });

  it("keeps the dialog open with an error when the change fails", async () => {
    jest.spyOn(adminServiceMock, "updateReportStatus").mockRejectedValueOnce(new Error("network"));
    const client = renderDetail("RECORDA", "recorda-1042");
    const invalidate = jest.spyOn(client, "invalidateQueries");

    await chooseStatusAction("Marcar como resolvida", "Confirmado.");
    fireEvent.press(screen.getByRole("button", { name: "Resolver" }));

    expect(
      await screen.findByText("Não foi possível alterar o status. Tente novamente.")
    ).toBeTruthy();
    expect(screen.getByText("Marcar denúncias como resolvidas")).toBeTruthy();
    expect(screen.getByLabelText("Motivo").props.value).toBe("Confirmado.");
    expect(invalidate).not.toHaveBeenCalled();
  });

  it("ends the session when the change is forbidden", async () => {
    jest
      .spyOn(adminServiceMock, "updateReportStatus")
      .mockRejectedValueOnce(new ApiError("FORBIDDEN", "denied", 403, null));
    jest.spyOn(Alert, "alert").mockImplementation(() => undefined);
    renderDetail("RECORDA", "recorda-1042");

    await chooseStatusAction("Descartar denúncia", "Sem motivo real.");
    fireEvent.press(screen.getByRole("button", { name: "Descartar" }));

    await waitFor(() => expect(mockClearSession).toHaveBeenCalledTimes(1));
    expect(mockReset).toHaveBeenCalledWith({ index: 0, routes: [{ name: "Login" }] });
    expect(screen.queryByText("Não foi possível alterar o status. Tente novamente.")).toBeNull();
  });

  it("says when the reported target no longer has reports and goes back", async () => {
    renderDetail("RECORDA", "recorda-inexistente");

    expect(await screen.findByText("Essa denúncia não existe mais.")).toBeTruthy();
    fireEvent.press(screen.getAllByRole("button", { name: "Voltar para as denúncias" })[1]);

    expect(mockGoBack).toHaveBeenCalledTimes(1);
  });

  it("retries a failed load", async () => {
    const detail = jest
      .spyOn(adminServiceMock, "getReportDetail")
      .mockRejectedValueOnce(new Error("network"))
      .mockRejectedValueOnce(new Error("network"));
    renderDetail("RECORDA", "recorda-1042");

    expect(
      await screen.findByText("Não foi possível carregar a denúncia.", {}, { timeout: 4000 })
    ).toBeTruthy();
    fireEvent.press(screen.getByRole("button", { name: "Tentar novamente" }));

    expect(await screen.findByText("RECORDA DENUNCIADA")).toBeTruthy();
    expect(detail).toHaveBeenCalledTimes(3);
  });

  it("returns to the list with the header arrow, or opens it when there is no history", async () => {
    renderDetail("RECORDA", "recorda-1042");
    await screen.findByText("RECORDA DENUNCIADA");

    fireEvent.press(screen.getByRole("button", { name: "Voltar para as denúncias" }));
    expect(mockGoBack).toHaveBeenCalledTimes(1);

    mockCanGoBack.mockReturnValue(false);
    fireEvent.press(screen.getByRole("button", { name: "Voltar para as denúncias" }));
    expect(mockNavigate).toHaveBeenCalledWith("AdminReports");
  });

  it("keeps the reports tab selected in the administrative navigation", async () => {
    renderDetail("RECORDA", "recorda-1042");
    await screen.findByText("RECORDA DENUNCIADA");

    expect(screen.getByRole("tab", { name: "Denúncias" }).props.accessibilityState).toMatchObject({
      selected: true
    });
  });
});
