import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";
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
import { i18n } from "@/i18n";
import { ApiError, AUTH_TOKEN_QUERY_KEY } from "@/services/api";
import { ToastProvider } from "@/components/ui/ToastProvider";
import { paperTheme } from "@/theme";

import { resetVideoMock } from "../../mocks/expoVideo";
import { SessionProviders } from "../../providers/SessionProviders";

jest.mock("@/features/admin/services/adminAdapter", () => ({
  adminAdapter: jest.requireActual("@/features/admin/services/adminService.mock").adminServiceMock
}));

jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual("@react-navigation/native"),
  useNavigation: () => ({
    canGoBack: () => true,
    goBack: jest.fn(),
    navigate: jest.fn(),
    reset: jest.fn()
  })
}));

const REMOVE_BUTTON = "Remover conteúdo";
const REMOVE_BUTTON_ID = "admin-report-remove-recorda";
const DIALOG_TITLE = "Remover esta Recorda?";
const DIALOG_WARNING =
  "Esta ação retira a publicação de todo o aplicativo (feed, buscas e perfil) e fica registrada na auditoria.";
const SUCCESS_MESSAGE = "Conteúdo removido";
const REASON = "Conteúdo impróprio.";

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
          <SessionProviders>
            <ToastProvider>
              <AdminReportDetailScreen targetId={targetId} targetType={targetType} />
            </ToastProvider>
          </SessionProviders>
        </PaperProvider>
      </I18nextProvider>
    </QueryClientProvider>
  );

  return client;
}

async function openRemovalDialog() {
  fireEvent.press(await screen.findByRole("button", { name: REMOVE_BUTTON }));
}

describe("AdminReportDetailScreen — Recorda removal", () => {
  beforeEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
    resetAdminServiceMock();
    resetVideoMock();
  });

  it("opens the removal dialog with the warning and blocks confirming without a reason", async () => {
    const remove = jest.spyOn(adminServiceMock, "removeRecorda");
    renderDetail("RECORDA", "recorda-1042");

    await openRemovalDialog();

    expect(screen.getByText(DIALOG_TITLE)).toBeTruthy();
    expect(screen.getByText(DIALOG_WARNING)).toBeTruthy();
    expect(screen.getByRole("button", { name: "Remover" }).props.accessibilityState).toMatchObject({
      disabled: true
    });

    fireEvent.changeText(screen.getByLabelText("Motivo"), "   ");
    fireEvent.press(screen.getByRole("button", { name: "Remover" }));

    expect(screen.getByRole("button", { name: "Remover" }).props.accessibilityState).toMatchObject({
      disabled: true
    });
    expect(remove).not.toHaveBeenCalled();

    fireEvent.changeText(screen.getByLabelText("Motivo"), REASON);

    expect(screen.getByRole("button", { name: "Remover" }).props.accessibilityState).toMatchObject({
      disabled: false
    });
  });

  it("removes the Recorda with a trimmed reason and refreshes the detail and the list", async () => {
    const remove = jest.spyOn(adminServiceMock, "removeRecorda");
    const client = renderDetail("RECORDA", "recorda-1042");
    const invalidate = jest.spyOn(client, "invalidateQueries");

    await openRemovalDialog();
    fireEvent.changeText(screen.getByLabelText("Motivo"), `  ${REASON}  `);
    fireEvent.press(screen.getByRole("button", { name: "Remover" }));

    await screen.findAllByText(SUCCESS_MESSAGE);
    expect(remove).toHaveBeenCalledWith("recorda-1042", { reason: REASON });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ADMIN_REPORTS_QUERY_KEY });
    expect(screen.queryByText(DIALOG_TITLE)).toBeNull();

    expect(await screen.findByText(/^Removida em \d{2}\/\d{2}\/\d{4}$/)).toBeTruthy();
    expect(screen.queryByTestId(REMOVE_BUTTON_ID)).toBeNull();
    expect(await screen.findByText(`Motivo: ${REASON}`)).toBeTruthy();

    const pending = await adminServiceMock.listReportGroups({ status: "OPEN" });
    expect(pending.items.map((group) => group.targetId)).not.toContain("recorda-1042");
    const resolved = await adminServiceMock.listReportGroups({ status: "RESOLVED" });
    expect(resolved.items.map((group) => group.targetId)).toContain("recorda-1042");
  });

  it("warns about a conflict and reloads when the Recorda was already handled", async () => {
    const alert = jest.spyOn(Alert, "alert").mockImplementation(() => undefined);
    jest
      .spyOn(adminServiceMock, "removeRecorda")
      .mockRejectedValueOnce(new ApiError("CONFLICT", "conflict", 409, null));
    const detail = jest.spyOn(adminServiceMock, "getReportDetail");
    renderDetail("RECORDA", "recorda-1042");

    await openRemovalDialog();
    fireEvent.changeText(screen.getByLabelText("Motivo"), REASON);
    fireEvent.press(screen.getByRole("button", { name: "Remover" }));

    await waitFor(() =>
      expect(alert).toHaveBeenCalledWith(
        "Este conteúdo já foi tratado",
        "Esta Recorda já foi removida. Os dados foram recarregados."
      )
    );
    await waitFor(() => expect(detail).toHaveBeenCalledTimes(2));
    expect(screen.queryByText(DIALOG_TITLE)).toBeNull();
    expect(screen.queryByText(SUCCESS_MESSAGE)).toBeNull();
  });

  it("keeps the dialog open with an error when the removal fails", async () => {
    jest.spyOn(adminServiceMock, "removeRecorda").mockRejectedValueOnce(new Error("network"));
    const client = renderDetail("RECORDA", "recorda-1042");
    const invalidate = jest.spyOn(client, "invalidateQueries");

    await openRemovalDialog();
    fireEvent.changeText(screen.getByLabelText("Motivo"), REASON);
    fireEvent.press(screen.getByRole("button", { name: "Remover" }));

    expect(
      await screen.findByText("Não foi possível remover o conteúdo. Tente novamente.")
    ).toBeTruthy();
    expect(screen.getByText(DIALOG_TITLE)).toBeTruthy();
    expect(screen.getByLabelText("Motivo").props.value).toBe(REASON);
    expect(invalidate).not.toHaveBeenCalled();
    expect(screen.queryByText(SUCCESS_MESSAGE)).toBeNull();
  });

  it("offers the removal for an active Recorda even when its reports are already closed", async () => {
    renderDetail("RECORDA", "recorda-1300");

    expect(await screen.findByTestId(REMOVE_BUTTON_ID)).toBeTruthy();
  });

  it.each(["user-1088", "user-1201"])(
    "never offers the removal for the reported profile %s",
    async (userId) => {
      renderDetail("USER", userId);

      expect(await screen.findByText("PERFIL DENUNCIADO")).toBeTruthy();
      expect(screen.queryByTestId(REMOVE_BUTTON_ID)).toBeNull();
      expect(screen.queryByRole("button", { name: REMOVE_BUTTON })).toBeNull();
    }
  );

  it("never offers the removal for a Recorda that was already removed", async () => {
    renderDetail("RECORDA", "recorda-1124");

    expect(await screen.findByTestId("admin-report-video")).toBeTruthy();
    expect(screen.getByText("Removida em 02/10/2026")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Marcar como resolvida" })).toBeTruthy();
    expect(screen.queryByTestId(REMOVE_BUTTON_ID)).toBeNull();
    expect(screen.queryByRole("button", { name: REMOVE_BUTTON })).toBeNull();
  });
});
