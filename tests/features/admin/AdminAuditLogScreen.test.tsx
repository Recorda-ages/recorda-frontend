import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react-native";
import { I18nextProvider } from "react-i18next";
import { PaperProvider } from "react-native-paper";

import { ToastProvider } from "@/components/ui";
import { AdminAuditLogScreen } from "@/features/admin/audit-log/screens/AdminAuditLogScreen";
import {
  adminServiceMock,
  resetAdminServiceMock
} from "@/features/admin/services/adminService.mock";
import type { AdminAuditEntry } from "@/features/admin/types";
import { AUTH_ME_QUERY_KEY } from "@/features/auth/api/getCurrentUser";
import { i18n } from "@/i18n";
import { ApiError } from "@/services/api";
import { paperTheme } from "@/theme";

jest.mock("@/features/admin/services/adminAdapter", () => ({
  adminAdapter: jest.requireActual("@/features/admin/services/adminService.mock").adminServiceMock
}));

jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual("@react-navigation/native"),
  useNavigation: () => ({ navigate: jest.fn(), reset: jest.fn() })
}));

jest.mock("@/features/admin/hooks/useAdminApiErrorHandler", () => ({
  useAdminApiErrorHandler: jest.fn(() => jest.fn(async () => false))
}));

const MOCK_ENTRY: AdminAuditEntry = {
  action_id: "entry-1",
  admin: { user_id: "admin-1", username: "admin" },
  action_type: "CHANGE_REPORT_STATUS",
  target_label: "user-target",
  target_user_id: null,
  target_recorda_id: "recorda-1",
  created_at: "2026-10-01T10:00:00Z",
  reason: "Conteúdo verificado",
  details: { from: "OPEN", to: "RESOLVED", report_count: 2 }
};

function localToday() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

function renderScreen() {
  const client = new QueryClient({
    defaultOptions: { mutations: { gcTime: Infinity }, queries: { gcTime: Infinity, retry: false } }
  });
  client.setQueryData(AUTH_ME_QUERY_KEY, {
    user_id: "admin-1",
    username: "admin",
    role: "ADMIN"
  });

  render(
    <QueryClientProvider client={client}>
      <I18nextProvider i18n={i18n}>
        <PaperProvider theme={paperTheme}>
          <ToastProvider>
            <AdminAuditLogScreen />
          </ToastProvider>
        </PaperProvider>
      </I18nextProvider>
    </QueryClientProvider>
  );

  return client;
}

describe("AdminAuditLogScreen", () => {
  beforeEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
    resetAdminServiceMock();
  });

  it("renders the title without a local search", async () => {
    jest.spyOn(adminServiceMock, "listAuditLog").mockResolvedValue({ items: [], total: 0 });
    renderScreen();

    expect(screen.getByTestId("admin-audit-log-screen")).toBeTruthy();
    expect(screen.getByText("Registro de Auditoria")).toBeTruthy();
    expect(screen.queryByTestId("admin-audit-log-search")).toBeNull();
    await screen.findByTestId("admin-audit-log-empty");
  });

  it("shows an empty state when there are no entries", async () => {
    jest.spyOn(adminServiceMock, "listAuditLog").mockResolvedValue({ items: [], total: 0 });
    renderScreen();

    expect(await screen.findByText("Nenhum registro encontrado.")).toBeTruthy();
    expect(screen.getByText("0 registros encontrados")).toBeTruthy();
  });

  it("shows who did what, on which target, when and why", async () => {
    jest
      .spyOn(adminServiceMock, "listAuditLog")
      .mockResolvedValue({ items: [MOCK_ENTRY], total: 1 });
    renderScreen();

    const entry = within(await screen.findByTestId("admin-audit-log-entry-entry-1"));

    expect(entry.getByText("admin")).toBeTruthy();
    expect(entry.getByText("user-target")).toBeTruthy();
    expect(entry.getByText(/alterou as denúncias de/)).toBeTruthy();
    expect(entry.getByText(/\(de Pendente para Resolvida\)/)).toBeTruthy();
    expect(entry.getByText("Motivo: Conteúdo verificado")).toBeTruthy();
    expect(entry.getByText(/^\d{2}\/\d{2}\/2026 • \d{2}:\d{2}$/)).toBeTruthy();
    expect(screen.getByText("1 registro encontrado")).toBeTruthy();
  });

  it("does not offer any action that changes a record", async () => {
    jest
      .spyOn(adminServiceMock, "listAuditLog")
      .mockResolvedValue({ items: [MOCK_ENTRY], total: 1 });
    renderScreen();

    const entry = await screen.findByTestId("admin-audit-log-entry-entry-1");

    expect(within(entry).queryAllByRole("button")).toEqual([]);
  });

  it("filters by administrator on the server", async () => {
    jest.spyOn(adminServiceMock, "listAdmins").mockResolvedValue([
      { user_id: "admin-1", username: "admin" },
      { user_id: "admin-2", username: "outro-admin" }
    ]);
    const list = jest
      .spyOn(adminServiceMock, "listAuditLog")
      .mockResolvedValue({ items: [], total: 0 });
    renderScreen();

    fireEvent.press(await screen.findByRole("radio", { name: "outro-admin" }));

    await waitFor(() =>
      expect(list).toHaveBeenLastCalledWith(
        expect.objectContaining({ admin_id: "admin-2", offset: 0 }),
        expect.any(AbortSignal)
      )
    );

    fireEvent.press(screen.getByRole("radio", { name: "Todos os admins" }));

    await waitFor(() => expect(list.mock.calls.at(-1)?.[0]).not.toHaveProperty("admin_id"));
  });

  it("hides the administrator filter when the list of admins is not available", async () => {
    jest.spyOn(adminServiceMock, "listAdmins").mockRejectedValue(new Error("offline"));
    jest.spyOn(adminServiceMock, "listAuditLog").mockResolvedValue({ items: [], total: 0 });
    renderScreen();

    await screen.findByTestId("admin-audit-log-empty");

    expect(screen.queryByRole("radio", { name: "Todos os admins" })).toBeNull();
  });

  it("describes other actions without a status change", async () => {
    jest.spyOn(adminServiceMock, "listAuditLog").mockResolvedValue({
      items: [
        { ...MOCK_ENTRY, action_type: "SUSPEND_USER", details: null },
        {
          ...MOCK_ENTRY,
          action_id: "entry-2",
          details: { to: "RESOLVED" }
        }
      ],
      total: 2
    });
    renderScreen();

    const suspended = within(await screen.findByTestId("admin-audit-log-entry-entry-1"));
    const partial = within(screen.getByTestId("admin-audit-log-entry-entry-2"));

    expect(suspended.getByText(/suspendeu a conta de/)).toBeTruthy();
    expect(suspended.queryByText(/\(de /)).toBeNull();
    expect(partial.getByText(/alterou as denúncias de/)).toBeTruthy();
    expect(partial.queryByText(/\(de /)).toBeNull();
  });

  it("loads the next page when the end of the list is reached", async () => {
    const list = jest
      .spyOn(adminServiceMock, "listAuditLog")
      .mockResolvedValueOnce({ items: [MOCK_ENTRY], total: 2 })
      .mockResolvedValueOnce({ items: [{ ...MOCK_ENTRY, action_id: "entry-2" }], total: 2 });
    renderScreen();

    await screen.findByTestId("admin-audit-log-entry-entry-1");
    fireEvent(screen.getByTestId("admin-audit-log-list"), "onEndReached");

    expect(await screen.findByTestId("admin-audit-log-entry-entry-2")).toBeTruthy();
    expect(list).toHaveBeenLastCalledWith(
      expect.objectContaining({ offset: 1 }),
      expect.any(AbortSignal)
    );
  });

  it("offers a retry when the next page fails", async () => {
    const error = new ApiError("ERROR", "server error", 500, null);
    jest
      .spyOn(adminServiceMock, "listAuditLog")
      .mockResolvedValueOnce({ items: [MOCK_ENTRY], total: 2 })
      .mockRejectedValueOnce(error)
      .mockRejectedValueOnce(error)
      .mockResolvedValueOnce({ items: [{ ...MOCK_ENTRY, action_id: "entry-2" }], total: 2 });
    renderScreen();

    await screen.findByTestId("admin-audit-log-entry-entry-1");
    fireEvent(screen.getByTestId("admin-audit-log-list"), "onEndReached");

    expect(
      await screen.findByText("Não foi possível carregar mais registros.", {}, { timeout: 5000 })
    ).toBeTruthy();

    fireEvent.press(screen.getByText("Tentar novamente"));

    expect(await screen.findByTestId("admin-audit-log-entry-entry-2")).toBeTruthy();
  });

  it("reloads the log on pull to refresh", async () => {
    const list = jest
      .spyOn(adminServiceMock, "listAuditLog")
      .mockResolvedValue({ items: [MOCK_ENTRY], total: 1 });
    renderScreen();

    await screen.findByTestId("admin-audit-log-entry-entry-1");
    const calls = list.mock.calls.length;

    await act(async () => {
      screen.getByTestId("admin-audit-log-list").props.refreshControl.props.onRefresh();
    });

    await waitFor(() => expect(list.mock.calls.length).toBeGreaterThan(calls));
  });

  it("shows an error state when loading fails and retries", async () => {
    const list = jest
      .spyOn(adminServiceMock, "listAuditLog")
      .mockRejectedValue(new ApiError("ERROR", "server error", 500, null));
    renderScreen();

    // useAuditLog retries a failed load once before showing the error.
    expect(
      await screen.findByText("Não foi possível carregar os registros.", {}, { timeout: 5000 })
    ).toBeTruthy();

    list.mockResolvedValue({ items: [MOCK_ENTRY], total: 1 });
    fireEvent.press(screen.getByText("Tentar novamente"));

    expect(await screen.findByTestId("admin-audit-log-entry-entry-1")).toBeTruthy();
  });

  it("sends today as the local calendar day", async () => {
    const list = jest
      .spyOn(adminServiceMock, "listAuditLog")
      .mockResolvedValue({ items: [], total: 0 });
    renderScreen();

    await waitFor(() => expect(list).toHaveBeenCalled());

    fireEvent.press(screen.getByRole("radio", { name: "Hoje" }));

    await waitFor(() =>
      expect(list).toHaveBeenLastCalledWith(
        expect.objectContaining({ date_from: localToday(), date_to: localToday() }),
        expect.any(AbortSignal)
      )
    );
  });

  it("sends the last month up to the local current day", async () => {
    const list = jest
      .spyOn(adminServiceMock, "listAuditLog")
      .mockResolvedValue({ items: [], total: 0 });
    renderScreen();

    await waitFor(() => expect(list).toHaveBeenCalled());

    fireEvent.press(screen.getByRole("radio", { name: "Último mês" }));

    await waitFor(() =>
      expect(list).toHaveBeenLastCalledWith(
        expect.objectContaining({ date_from: expect.any(String), date_to: localToday() }),
        expect.any(AbortSignal)
      )
    );
  });
});
