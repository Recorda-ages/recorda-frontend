import { SessionProviders } from "../../providers/SessionProviders";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import { I18nextProvider } from "react-i18next";
import { PaperProvider } from "react-native-paper";

import { AdminReportsScreen } from "@/features/admin/reports/screens/AdminReportsScreen";
import { ToastProvider } from "@/components/ui/ToastProvider";
import type { AdminReportGroup, AdminReportPageResponse } from "@/features/admin/types";
import { AUTH_ME_QUERY_KEY } from "@/features/auth/api/getCurrentUser";
import { clearSession } from "@/features/auth/session";
import { i18n } from "@/i18n";
import { AUTH_TOKEN_QUERY_KEY } from "@/services/api";
import { secureStorage } from "@/services/storage";
import { paperTheme } from "@/theme";

const mockNavigate = jest.fn();
const mockReset = jest.fn();
const mockNavigation = { navigate: mockNavigate, reset: mockReset };

jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual("@react-navigation/native"),
  useNavigation: () => mockNavigation
}));

jest.mock("@/features/auth/session", () => ({
  ...jest.requireActual("@/features/auth/session"),
  clearSession: jest.fn(async () => undefined)
}));

jest.mock("@/services/storage", () => ({
  secureStorage: { getItem: jest.fn(), removeItem: jest.fn(), setItem: jest.fn() }
}));

const API = "http://localhost:8000/api/v1/admin/reports";
const fetchMock = jest.fn();
globalThis.fetch = fetchMock as unknown as typeof fetch;

const mockClearSession = clearSession as jest.Mock;
const mockGetItem = secureStorage.getItem as jest.Mock;

type ApiGroup = AdminReportPageResponse["items"][number];

function apiGroup(id: string, overrides: Partial<ApiGroup> = {}): ApiGroup {
  return {
    first_reported_at: "2026-10-01T12:00:00Z",
    last_reported_at: "2026-10-05T12:00:00Z",
    preview: { image_url: null, subtitle: "@marina", title: `Levitating ${id}` },
    report_count: 3,
    status: "OPEN",
    target_id: id,
    target_type: "RECORDA",
    ...overrides
  };
}

function response(status: number, body: unknown) {
  return {
    headers: { get: () => "application/json" },
    json: async () => body,
    ok: status >= 200 && status < 300,
    status
  };
}

function page(items: ApiGroup[], total = items.length) {
  return response(200, { items, total });
}

function requestedUrls() {
  return fetchMock.mock.calls.map(([url]) => String(url));
}

function renderScreen() {
  const client = new QueryClient({ defaultOptions: { queries: { gcTime: Infinity } } });
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
              <AdminReportsScreen />
            </ToastProvider>
          </SessionProviders>
        </PaperProvider>
      </I18nextProvider>
    </QueryClientProvider>
  );
}

function listData() {
  return screen.getByTestId("admin-reports-list").props.data as AdminReportGroup[];
}

describe("AdminReportsScreen with the real API", () => {
  beforeEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
    fetchMock.mockReset();
    mockGetItem.mockResolvedValue("token-abc");
  });

  it("loads the pending groups from the API with the admin token", async () => {
    fetchMock.mockResolvedValue(
      page([
        apiGroup("recorda-1"),
        apiGroup("user-1", {
          preview: { image_url: null, subtitle: "@usuario2", title: "Usuário Dois" },
          report_count: 1,
          target_type: "USER"
        })
      ])
    );
    renderScreen();

    expect(await screen.findByText("@marina — Levitating recorda-1")).toBeTruthy();
    expect(screen.getByText("@usuario2 — Usuário Dois")).toBeTruthy();
    expect(screen.getByText("2 denúncias agrupadas")).toBeTruthy();
    expect(screen.getAllByText("05/10/2026")).toHaveLength(2);
    expect(screen.queryByText(/^Por @/)).toBeNull();
    expect(screen.queryByTestId("admin-reports-search")).toBeNull();

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(`${API}?status=OPEN&limit=20&offset=0&order=desc`);
    expect(init).toMatchObject({
      headers: expect.objectContaining({ Authorization: "Bearer token-abc" }),
      method: "GET"
    });
  });

  it("sends the combined type, status and order filters to the API", async () => {
    fetchMock.mockResolvedValue(page([apiGroup("recorda-1")]));
    renderScreen();
    await screen.findByText("@marina — Levitating recorda-1");

    fireEvent.press(screen.getByRole("radio", { name: "Perfis" }));
    fireEvent.press(screen.getByRole("radio", { name: "Resolvidas" }));
    fireEvent.press(screen.getByTestId("admin-reports-order"));

    await waitFor(() =>
      expect(requestedUrls()).toContain(
        `${API}?status=RESOLVED&limit=20&offset=0&order=asc&target_type=USER`
      )
    );
  });

  it("pages through the API by offset without skipping or repeating groups", async () => {
    const first = Array.from({ length: 20 }, (_, index) => apiGroup(`recorda-${index}`));
    const second = Array.from({ length: 5 }, (_, index) => apiGroup(`recorda-${index + 20}`));
    fetchMock.mockResolvedValueOnce(page(first, 25)).mockResolvedValueOnce(page(second, 25));
    renderScreen();
    await screen.findByText("25 denúncias agrupadas");

    fireEvent(screen.getByTestId("admin-reports-list"), "onEndReached");

    await waitFor(() => expect(listData()).toHaveLength(25));
    expect(new Set(listData().map((item) => item.targetId)).size).toBe(25);
    expect(requestedUrls()).toEqual([
      `${API}?status=OPEN&limit=20&offset=0&order=desc`,
      `${API}?status=OPEN&limit=20&offset=20&order=desc`
    ]);

    fireEvent(screen.getByTestId("admin-reports-list"), "onEndReached");
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("ends the session and returns to Login when the API answers 401", async () => {
    fetchMock.mockResolvedValue(
      response(401, { error: { code: "UNAUTHORIZED", details: null, message: "expired" } })
    );
    renderScreen();

    await waitFor(() => expect(mockClearSession).toHaveBeenCalledTimes(1));
    expect(screen.getByText("Sessão encerrada. Sua sessão expirou.")).toBeTruthy();
    expect(mockReset).toHaveBeenCalledWith({ index: 0, routes: [{ name: "Login" }] });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("warns that access is not allowed when the API answers 403", async () => {
    fetchMock.mockResolvedValue(
      response(403, { error: { code: "FORBIDDEN", details: null, message: "denied" } })
    );
    renderScreen();

    expect(
      await screen.findByText(
        "Acesso administrativo removido. Sua conta não tem acesso administrativo."
      )
    ).toBeTruthy();
    await waitFor(() => expect(mockClearSession).toHaveBeenCalledTimes(1));
    expect(mockReset).toHaveBeenCalledWith({ index: 0, routes: [{ name: "Login" }] });
  });

  it.each([
    ["a server error", () => fetchMock.mockResolvedValueOnce(response(500, { detail: "boom" }))],
    ["a network failure", () => fetchMock.mockRejectedValueOnce(new TypeError("offline"))]
  ])("offers a retry after %s", async (_label, fail) => {
    fail();
    fail();
    fetchMock.mockResolvedValueOnce(page([apiGroup("recorda-1")]));
    renderScreen();

    expect(
      await screen.findByText("Não foi possível carregar as denúncias.", {}, { timeout: 4000 })
    ).toBeTruthy();
    fireEvent.press(screen.getByRole("button", { name: "Tentar novamente" }));

    expect(await screen.findByText("@marina — Levitating recorda-1")).toBeTruthy();
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(screen.queryByTestId("app-toast")).toBeNull();
    expect(mockClearSession).not.toHaveBeenCalled();
  });

  it("shows the empty state when the API has no groups", async () => {
    fetchMock.mockResolvedValue(page([]));
    renderScreen();

    expect(await screen.findByText("Nenhuma denúncia pendente")).toBeTruthy();
    expect(screen.getByText("0 denúncias agrupadas")).toBeTruthy();
  });

  it("asks the API again on pull-to-refresh", async () => {
    fetchMock
      .mockResolvedValueOnce(page([apiGroup("recorda-1")]))
      .mockResolvedValueOnce(page([apiGroup("recorda-1"), apiGroup("recorda-2")]));
    renderScreen();
    await screen.findByText("@marina — Levitating recorda-1");

    const { refreshControl } = screen.getByTestId("admin-reports-list").props;
    await act(async () => {
      refreshControl.props.onRefresh();
    });

    expect(await screen.findByText("@marina — Levitating recorda-2")).toBeTruthy();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
