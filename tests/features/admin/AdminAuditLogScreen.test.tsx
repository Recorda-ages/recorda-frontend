import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import { I18nextProvider } from "react-i18next";
import { PaperProvider } from "react-native-paper";

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
import { ToastProvider } from "@/components/ui";

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
  reason: "razao",
  details: { from: "PENDING", to: "RESOLVED" }
};

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

  it("renders the title and search input", async () => {
    jest.spyOn(adminServiceMock, "listAuditLog").mockResolvedValue({ items: [], total: 0 });
    renderScreen();

    expect(screen.getByTestId("admin-audit-log-screen")).toBeTruthy();
    expect(screen.getByTestId("admin-audit-log-search")).toBeTruthy();
  });

  it("shows an empty state when there are no entries", async () => {
    jest.spyOn(adminServiceMock, "listAuditLog").mockResolvedValue({ items: [], total: 0 });
    renderScreen();

    await waitFor(() => expect(screen.getByTestId("admin-audit-log-empty")).toBeTruthy());
  });

  it("shows loaded entries in the list", async () => {
    jest
      .spyOn(adminServiceMock, "listAuditLog")
      .mockResolvedValue({ items: [MOCK_ENTRY], total: 1 });
    renderScreen();

    await waitFor(() => expect(screen.getByTestId("admin-audit-log-list")).toBeTruthy());
    expect(screen.getByTestId("admin-audit-log-count")).toBeTruthy();
    expect(screen.getByText("admin")).toBeTruthy();
    expect(screen.getByText("user-target")).toBeTruthy();
  });

  it("filters entries by search text", async () => {
    const otherEntry: AdminAuditEntry = {
      ...MOCK_ENTRY,
      action_id: "entry-2",
      admin: { user_id: "admin-2", username: "outro-admin" },
      target_label: "outro-alvo"
    };
    jest
      .spyOn(adminServiceMock, "listAuditLog")
      .mockResolvedValue({ items: [MOCK_ENTRY, otherEntry], total: 2 });
    renderScreen();

    await waitFor(() => expect(screen.getByTestId("admin-audit-log-list")).toBeTruthy());

    fireEvent.changeText(screen.getByTestId("admin-audit-log-search"), "outro-admin");

    expect(screen.getByText("outro-admin")).toBeTruthy();
    expect(screen.queryByText("admin")).toBeNull();
  });

  it("shows an error state when loading fails", async () => {
    jest
      .spyOn(adminServiceMock, "listAuditLog")
      .mockRejectedValue(new ApiError("ERROR", "server error", 500, null));
    renderScreen();

    await waitFor(() => expect(screen.getByText(i18n.t("admin.auditLog.loadError"))).toBeTruthy(), {
      timeout: 8000
    });
    expect(screen.getByText(i18n.t("admin.auditLog.retry"))).toBeTruthy();
  });

  it("applies today period filter and passes date range to the query", async () => {
    const list = jest
      .spyOn(adminServiceMock, "listAuditLog")
      .mockResolvedValue({ items: [], total: 0 });
    renderScreen();

    await waitFor(() => expect(list).toHaveBeenCalled());

    fireEvent.press(screen.getByText(i18n.t("admin.auditLog.filters.today")));

    await waitFor(() => {
      const lastCall = list.mock.calls.at(-1)?.[0];
      expect(lastCall).toHaveProperty("date_from");
      expect(lastCall).toHaveProperty("date_to");
      const today = new Date().toISOString().slice(0, 10);
      expect(lastCall?.date_from).toBe(today);
    });
  });

  it("applies last month period filter and passes date range to the query", async () => {
    const list = jest
      .spyOn(adminServiceMock, "listAuditLog")
      .mockResolvedValue({ items: [], total: 0 });
    renderScreen();

    await waitFor(() => expect(list).toHaveBeenCalled());

    fireEvent.press(screen.getByText(i18n.t("admin.auditLog.filters.lastMonth")));

    await waitFor(() => {
      const lastCall = list.mock.calls.at(-1)?.[0];
      expect(lastCall).toHaveProperty("date_from");
      expect(lastCall).toHaveProperty("date_to");
      const today = new Date().toISOString().slice(0, 10);
      expect(lastCall?.date_to).toBe(today);
    });
  });
});
