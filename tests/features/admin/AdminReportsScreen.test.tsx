import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react-native";
import { I18nextProvider } from "react-i18next";
import { PaperProvider } from "react-native-paper";

import {
  ADMIN_REPORTS_SEARCH_DEBOUNCE_MS,
  AdminReportsScreen
} from "@/features/admin/reports/screens/AdminReportsScreen";
import { adminServiceMock } from "@/features/admin/services/adminService.mock";
import type { AdminReportGroup, AdminReportPage } from "@/features/admin/types";
import { AUTH_ME_QUERY_KEY } from "@/features/auth/api/getCurrentUser";
import { clearSession } from "@/features/auth/session";
import { i18n } from "@/i18n";
import { ApiError, AUTH_TOKEN_QUERY_KEY } from "@/services/api";
import { paperTheme } from "@/theme";

const mockNavigate = jest.fn();
const mockReset = jest.fn();

jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual("@react-navigation/native"),
  useNavigation: () => ({ navigate: mockNavigate, reset: mockReset })
}));

jest.mock("@/features/admin/services/adminAdapter", () => ({
  adminAdapter: jest.requireActual("@/features/admin/services/adminService.mock").adminServiceMock
}));

jest.mock("@/features/auth/session", () => ({
  ...jest.requireActual("@/features/auth/session"),
  clearSession: jest.fn(async () => undefined)
}));

const mockClearSession = clearSession as jest.Mock;
const PAGE_SIZE = 20;

const MARINA: AdminReportGroup = {
  contentSummary: "Levitating",
  imageUrl: "https://e.deezer.com/cover.jpg",
  latestReportedAt: "2026-10-05T12:00:00Z",
  latestReporterUsername: "paulo",
  openReportCount: 3,
  status: "OPEN",
  targetId: "recorda-1",
  targetLabel: "Levitating",
  targetType: "RECORDA",
  targetUsername: "marina"
};

const USUARIO2: AdminReportGroup = {
  contentSummary: "Usuário Dois",
  imageUrl: null,
  latestReportedAt: "2026-10-04T12:00:00Z",
  latestReporterUsername: "bia",
  openReportCount: 1,
  status: "OPEN",
  targetId: "user-2",
  targetLabel: "Usuário Dois",
  targetType: "USER",
  targetUsername: "usuario2"
};

function pageOf(
  items: AdminReportGroup[],
  total = items.length,
  nextCursor: string | null = null
): AdminReportPage {
  return { items, nextCursor, total };
}

function groups(count: number, start = 0): AdminReportGroup[] {
  return Array.from({ length: count }, (_, i) => ({ ...MARINA, targetId: `recorda-${start + i}` }));
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

  return render(
    <QueryClientProvider client={client}>
      <I18nextProvider i18n={i18n}>
        <PaperProvider theme={paperTheme}>
          <AdminReportsScreen />
        </PaperProvider>
      </I18nextProvider>
    </QueryClientProvider>
  );
}

function mockList() {
  return jest.spyOn(adminServiceMock, "listReportGroups");
}

function listData() {
  return screen.getByTestId("admin-reports-list").props.data as AdminReportGroup[];
}

describe("AdminReportsScreen", () => {
  beforeEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });

  it("opens with pending reports, newest first, grouped with their count", async () => {
    const list = mockList().mockResolvedValue(pageOf([MARINA, USUARIO2]));
    renderScreen();

    expect(await screen.findByText("@marina — Levitating")).toBeTruthy();
    expect(list).toHaveBeenCalledWith(
      expect.objectContaining({ order: "desc", status: "OPEN" }),
      expect.anything()
    );
    expect(list.mock.calls[0][0]?.targetType).toBeUndefined();
    expect(screen.getByText("Denúncias")).toBeTruthy();
    expect(screen.getByText("@admin")).toBeTruthy();
    expect(screen.getByText("2 denúncias agrupadas")).toBeTruthy();
    expect(screen.getByText("RECORDA")).toBeTruthy();
    expect(screen.getAllByText("PENDENTE")).toHaveLength(2);
    expect(screen.getByText("3 denúncias")).toBeTruthy();
    expect(screen.getByText("1 denúncia")).toBeTruthy();
    expect(screen.getByText("Por @paulo • 05/10/2026")).toBeTruthy();
    expect(screen.getByText("@usuario2 — Usuário Dois")).toBeTruthy();
    expect(screen.getByRole("radio", { name: "Pendentes" }).props.accessibilityState).toMatchObject(
      { checked: true }
    );
    expect(screen.queryByRole("radio", { name: "Todos os status" })).toBeNull();
    expect(screen.getByText("Mais recentes")).toBeTruthy();
    expect(screen.queryByText("Feed")).toBeNull();
    expect(screen.queryByText("Câmera")).toBeNull();
  });

  it("shows the thumbnail when there is an image and a type icon otherwise", async () => {
    mockList().mockResolvedValue(pageOf([MARINA, USUARIO2]));
    renderScreen();

    expect(await screen.findByTestId("admin-report-thumbnail-recorda-1")).toBeTruthy();
    expect(screen.getByTestId("admin-report-thumbnail-fallback-user-2")).toBeTruthy();
  });

  it("uses the API total for the grouped count, not only the loaded page", async () => {
    mockList().mockResolvedValue(pageOf(groups(PAGE_SIZE), 37, String(PAGE_SIZE)));
    renderScreen();

    expect(await screen.findByText("37 denúncias agrupadas")).toBeTruthy();
  });

  it("combines type, status and order filters in the request", async () => {
    const list = mockList().mockResolvedValue(pageOf([MARINA]));
    renderScreen();
    await screen.findByText("@marina — Levitating");

    fireEvent.press(screen.getByRole("radio", { name: "Perfis" }));
    fireEvent.press(screen.getByRole("radio", { name: "Resolvidas" }));
    fireEvent.press(screen.getByTestId("admin-reports-order"));

    await waitFor(() =>
      expect(list).toHaveBeenLastCalledWith(
        expect.objectContaining({ order: "asc", status: "RESOLVED", targetType: "USER" }),
        expect.anything()
      )
    );
    expect(await screen.findByText("@marina — Levitating")).toBeTruthy();
    expect(screen.getByText("Mais antigas")).toBeTruthy();
  });

  it("searches by user or content only after the debounce", async () => {
    const list = mockList().mockResolvedValue(pageOf([MARINA]));
    renderScreen();
    await screen.findByText("@marina — Levitating");

    fireEvent.changeText(screen.getByTestId("admin-reports-search"), "  marina ");
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, ADMIN_REPORTS_SEARCH_DEBOUNCE_MS / 2));
    });

    expect(list).toHaveBeenCalledTimes(1);
    await waitFor(
      () =>
        expect(list).toHaveBeenLastCalledWith(
          expect.objectContaining({ query: "marina" }),
          expect.anything()
        ),
      { timeout: ADMIN_REPORTS_SEARCH_DEBOUNCE_MS * 4 }
    );
    expect(await screen.findByText("@marina — Levitating")).toBeTruthy();
  });

  it("opens the report target detail with its typed params", async () => {
    mockList().mockResolvedValue(pageOf([MARINA]));
    renderScreen();

    fireEvent.press(await screen.findByTestId("admin-report-row-RECORDA-recorda-1"));

    expect(mockNavigate).toHaveBeenCalledWith("AdminReportDetail", {
      targetId: "recorda-1",
      targetType: "RECORDA"
    });
  });

  it("loads the next page when the end of the list is reached", async () => {
    const list = mockList()
      .mockResolvedValueOnce(pageOf(groups(PAGE_SIZE), 25, String(PAGE_SIZE)))
      .mockResolvedValueOnce(pageOf(groups(5, PAGE_SIZE), 25));
    renderScreen();
    await screen.findByText("25 denúncias agrupadas");

    fireEvent(screen.getByTestId("admin-reports-list"), "onEndReached");

    await waitFor(() =>
      expect(list).toHaveBeenLastCalledWith(
        expect.objectContaining({ cursor: String(PAGE_SIZE) }),
        expect.anything()
      )
    );
    await waitFor(() => expect(listData()).toHaveLength(25));
  });

  it("does not ask for another page when everything is loaded", async () => {
    const list = mockList().mockResolvedValue(pageOf([MARINA]));
    renderScreen();
    await screen.findByText("@marina — Levitating");

    fireEvent(screen.getByTestId("admin-reports-list"), "onEndReached");

    expect(list).toHaveBeenCalledTimes(1);
  });

  it("keeps the loaded groups and offers a retry when the next page fails", async () => {
    const list = mockList()
      .mockResolvedValueOnce(pageOf(groups(PAGE_SIZE), 25, String(PAGE_SIZE)))
      .mockRejectedValueOnce(new Error("network"))
      .mockRejectedValueOnce(new Error("network"))
      .mockResolvedValueOnce(pageOf(groups(5, PAGE_SIZE), 25));
    renderScreen();
    await screen.findByText("25 denúncias agrupadas");

    fireEvent(screen.getByTestId("admin-reports-list"), "onEndReached");

    expect(
      await screen.findByText("Não foi possível carregar mais denúncias.", {}, { timeout: 4000 })
    ).toBeTruthy();
    expect(screen.getByTestId("admin-report-row-RECORDA-recorda-0")).toBeTruthy();

    fireEvent.press(screen.getByRole("button", { name: "Tentar novamente" }));

    await waitFor(() => expect(listData()).toHaveLength(25));
    expect(list).toHaveBeenCalledTimes(4);
  });

  it("refetches on pull-to-refresh", async () => {
    const list = mockList().mockResolvedValue(pageOf([MARINA]));
    renderScreen();
    await screen.findByText("@marina — Levitating");

    const { refreshControl } = screen.getByTestId("admin-reports-list").props;
    await act(async () => {
      refreshControl.props.onRefresh();
    });

    await waitFor(() => expect(list).toHaveBeenCalledTimes(2));
  });

  it.each([
    ["Pendentes", "Nenhuma denúncia pendente"],
    ["Resolvidas", "Nenhuma denúncia resolvida"],
    ["Descartadas", "Nenhuma denúncia descartada"]
  ])("shows the empty state for %s", async (chip, message) => {
    mockList().mockResolvedValue(pageOf([]));
    renderScreen();
    await screen.findByTestId("admin-reports-empty");

    fireEvent.press(screen.getByRole("radio", { name: chip }));

    expect(await screen.findByText(message)).toBeTruthy();
    expect(screen.getByText("0 denúncias agrupadas")).toBeTruthy();
  });

  it("shows a search-specific empty state", async () => {
    mockList().mockResolvedValue(pageOf([]));
    renderScreen();
    await screen.findByTestId("admin-reports-empty");

    fireEvent.changeText(screen.getByTestId("admin-reports-search"), "ninguém");

    expect(
      await screen.findByText("Nenhuma denúncia encontrada para essa busca", {}, { timeout: 2000 })
    ).toBeTruthy();
  });

  it("shows a retryable error when the first page fails", async () => {
    const list = mockList()
      .mockRejectedValueOnce(new Error("network"))
      .mockRejectedValueOnce(new Error("network"))
      .mockResolvedValueOnce(pageOf([MARINA]));
    renderScreen();

    expect(
      await screen.findByText("Não foi possível carregar as denúncias.", {}, { timeout: 4000 })
    ).toBeTruthy();

    fireEvent.press(screen.getByRole("button", { name: "Tentar novamente" }));

    expect(await screen.findByText("@marina — Levitating")).toBeTruthy();
    expect(list).toHaveBeenCalledTimes(3);
  });

  it("ends the session when the admin API answers 403", async () => {
    mockList().mockRejectedValue(new ApiError("FORBIDDEN", "denied", 403, null));
    renderScreen();

    await waitFor(() => expect(mockClearSession).toHaveBeenCalledTimes(1));
    expect(mockReset).toHaveBeenCalledWith({ index: 0, routes: [{ name: "Login" }] });
  });

  it("navigates only within the administrative bottom navigation", async () => {
    mockList().mockResolvedValue(pageOf([MARINA]));
    renderScreen();
    await screen.findByText("@marina — Levitating");

    fireEvent.press(screen.getByRole("tab", { name: "Usuários" }));

    expect(mockNavigate).toHaveBeenCalledWith("AdminUsers");
    expect(screen.getByRole("tab", { name: "Denúncias" }).props.accessibilityState).toMatchObject({
      selected: true
    });
  });

  it("clears the session and resets to Login on logout", async () => {
    mockList().mockResolvedValue(pageOf([MARINA]));
    renderScreen();
    await screen.findByText("@marina — Levitating");

    fireEvent.press(screen.getByRole("button", { name: "Sair" }));

    await waitFor(() => expect(mockClearSession).toHaveBeenCalledTimes(1));
    expect(mockReset).toHaveBeenCalledWith({ index: 0, routes: [{ name: "Login" }] });
  });

  it("marks the selected chips with a check", async () => {
    mockList().mockResolvedValue(pageOf([MARINA]));
    renderScreen();
    await screen.findByText("@marina — Levitating");

    const hidden = { includeHiddenElements: true };
    const selected = screen.getByRole("radio", { name: "Todas" });
    const unselected = screen.getByRole("radio", { name: "Perfis" });

    expect(within(selected).queryByTestId("filter-chip-check", hidden)).toBeTruthy();
    expect(within(unselected).queryByTestId("filter-chip-check", hidden)).toBeNull();
  });
});
