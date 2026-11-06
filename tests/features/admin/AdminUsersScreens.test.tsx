import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react-native";
import { I18nextProvider } from "react-i18next";
import { PaperProvider } from "react-native-paper";

import { AdminUserDetailScreen } from "@/features/admin/users/screens/AdminUserDetailScreen";
import { adminUserService } from "@/features/admin/services/adminUserService";
import { ADMIN_USERS_QUERY_KEY } from "@/features/admin/users/queryKeys";
import {
  ADMIN_USERS_SEARCH_DEBOUNCE_MS,
  AdminUsersScreen
} from "@/features/admin/users/screens/AdminUsersScreen";
import {
  adminUsersServiceMock,
  resetAdminUsersMock
} from "@/features/admin/users/services/adminUsersService.mock";
import { adminUserRows } from "@/features/admin/users/fixtures/adminUsers";
import { AUTH_ME_QUERY_KEY } from "@/features/auth/api/getCurrentUser";
import { i18n } from "@/i18n";
import { paperTheme } from "@/theme";

const FIRST_USER_ID = "00000000-0000-4000-8000-000000001042";
const SUSPENDED_USER_ID = "00000000-0000-4000-8000-000000001088";

function renderWithProviders(children: React.ReactNode) {
  const client = new QueryClient({
    defaultOptions: { queries: { gcTime: Infinity, retry: false, retryDelay: 0 } }
  });
  client.setQueryData(AUTH_ME_QUERY_KEY, {
    name: "Admin Recorda",
    onboarding_completed: true,
    role: "ADMIN",
    user_id: "admin-test",
    username: "admin"
  });

  render(
    <QueryClientProvider client={client}>
      <I18nextProvider i18n={i18n}>
        <PaperProvider theme={paperTheme}>{children}</PaperProvider>
      </I18nextProvider>
    </QueryClientProvider>
  );
  return client;
}

describe("admin user screens", () => {
  beforeEach(() => {
    jest.restoreAllMocks();
    resetAdminUsersMock();
    jest.spyOn(adminUserService, "list").mockImplementation((filters = {}, signal) =>
      adminUsersServiceMock.listUsers(
        {
          limit: filters.limit ?? 20,
          offset: filters.offset ?? 0,
          q: filters.q,
          status: filters.status
        },
        signal
      )
    );
    jest
      .spyOn(adminUserService, "get")
      .mockImplementation((userId, signal) => adminUsersServiceMock.getUserDetail(userId, signal));
  });

  it("shows the mock user total and account cards", async () => {
    renderWithProviders(<AdminUsersScreen onViewHistory={jest.fn()} />);

    expect(await screen.findByText("6 usuários encontrados")).toBeTruthy();
    const firstCard = screen.getByTestId(`admin-user-card-${FIRST_USER_ID}`);
    expect(within(firstCard).getByText("ID #1042")).toBeTruthy();
    expect(screen.getByText("2 denúncias")).toBeTruthy();
    expect(screen.getAllByText("sem denúncias")).toHaveLength(2);
  });

  it("debounces search and filters the list by active or suspended status", async () => {
    const listUsers = jest.spyOn(adminUserService, "list");
    renderWithProviders(<AdminUsersScreen onViewHistory={jest.fn()} />);
    await screen.findByText("6 usuários encontrados");

    fireEvent.changeText(screen.getByTestId("admin-users-search"), "marina");
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, ADMIN_USERS_SEARCH_DEBOUNCE_MS + 30));
    });
    expect(await screen.findByText("1 usuário encontrado")).toBeTruthy();
    expect(listUsers).toHaveBeenLastCalledWith(
      expect.objectContaining({ q: "marina" }),
      expect.anything()
    );
    expect(screen.getByTestId("admin-user-card-00000000-0000-4000-8000-000000001124")).toBeTruthy();

    fireEvent.changeText(screen.getByTestId("admin-users-search"), "");
    await screen.findByText("6 usuários encontrados");
    fireEvent.press(screen.getByRole("radio", { name: "Suspensos" }));

    expect(await screen.findByText("1 usuário encontrado")).toBeTruthy();
    expect(screen.getByTestId(`admin-user-card-${SUSPENDED_USER_ID}`)).toBeTruthy();
    expect(screen.queryByTestId(`admin-user-card-${FIRST_USER_ID}`)).toBeNull();
  });

  it("passes the full UUID to the history callback", async () => {
    const onViewHistory = jest.fn();
    renderWithProviders(<AdminUsersScreen onViewHistory={onViewHistory} />);

    fireEvent.press(await screen.findByTestId(`admin-user-history-${FIRST_USER_ID}`));

    expect(onViewHistory).toHaveBeenCalledWith(FIRST_USER_ID);
  });

  it("loads the next page when the list reaches its end", async () => {
    const rows = Array.from({ length: 25 }, (_, index) => {
      const number = String(index + 1).padStart(12, "0");
      return {
        ...adminUserRows[index % adminUserRows.length],
        email: `user${index + 1}@email.com`,
        user_id: `00000000-0000-4000-8000-${number}`,
        username: `user${index + 1}`
      };
    });
    const listUsers = jest
      .spyOn(adminUserService, "list")
      .mockImplementation(async (filters = {}) => ({
        items: rows.slice(filters.offset ?? 0, (filters.offset ?? 0) + (filters.limit ?? 20)),
        total: rows.length
      }));
    const client = renderWithProviders(<AdminUsersScreen onViewHistory={jest.fn()} />);

    expect(await screen.findByText("25 usuários encontrados")).toBeTruthy();
    await act(async () => {
      fireEvent(screen.getByTestId("admin-users-list"), "onEndReached");
      await waitFor(() => expect(listUsers).toHaveBeenCalledTimes(2));
    });
    expect(listUsers).toHaveBeenLastCalledWith(
      expect.objectContaining({ limit: 20, offset: 20 }),
      expect.anything()
    );
    await waitFor(() => {
      const data = client.getQueryCache().findAll({ queryKey: ADMIN_USERS_QUERY_KEY })[0]?.state
        .data as { pages?: unknown[] } | undefined;
      expect(data?.pages).toHaveLength(2);
    });
  });

  it("shows an empty state for a search with no matches", async () => {
    renderWithProviders(<AdminUsersScreen onViewHistory={jest.fn()} />);
    await screen.findByText("6 usuários encontrados");
    fireEvent.changeText(screen.getByTestId("admin-users-search"), "sem-correspondencia");

    expect(await screen.findByText("0 usuários encontrados")).toBeTruthy();
    expect(await screen.findByText("Nenhum usuário encontrado para essa busca.")).toBeTruthy();
  });

  it("shows a retry action after the mock list fails twice", async () => {
    const originalListUsers = jest.mocked(adminUserService.list).getMockImplementation()!;
    const listUsers = jest
      .spyOn(adminUserService, "list")
      .mockRejectedValueOnce(new Error("temporary failure"))
      .mockRejectedValueOnce(new Error("temporary failure"))
      .mockImplementation(originalListUsers);
    renderWithProviders(<AdminUsersScreen onViewHistory={jest.fn()} />);

    expect(await screen.findByText("Não foi possível carregar os usuários.")).toBeTruthy();
    fireEvent.press(screen.getByRole("button", { name: "Tentar novamente" }));

    expect(await screen.findByText("6 usuários encontrados")).toBeTruthy();
    expect(listUsers).toHaveBeenCalledTimes(3);
  });

  it("renders report and action history, and copies the complete UUID", async () => {
    const copy = jest.fn(async () => undefined);
    renderWithProviders(
      <AdminUserDetailScreen onBack={jest.fn()} onCopyUserId={copy} userId={SUSPENDED_USER_ID} />
    );

    expect(await screen.findByTestId("admin-user-detail-content")).toBeTruthy();
    expect(screen.getByText(SUSPENDED_USER_ID)).toBeTruthy();
    expect(screen.getByText("Perfil denunciado")).toBeTruthy();
    expect(screen.getByText("Conta suspensa")).toBeTruthy();
    fireEvent.press(screen.getByTestId("admin-user-copy-id"));

    await waitFor(() => expect(copy).toHaveBeenCalledWith(SUSPENDED_USER_ID));
    expect(await screen.findByText("ID copiado.")).toBeTruthy();
  });

  it("offers a retry when detail loading fails", async () => {
    const originalGetUserDetail = jest.mocked(adminUserService.get).getMockImplementation()!;
    const getUserDetail = jest
      .spyOn(adminUserService, "get")
      .mockRejectedValueOnce(new Error("temporary failure"))
      .mockRejectedValueOnce(new Error("temporary failure"))
      .mockImplementation(originalGetUserDetail);
    renderWithProviders(
      <AdminUserDetailScreen
        onBack={jest.fn()}
        onCopyUserId={jest.fn()}
        userId={SUSPENDED_USER_ID}
      />
    );

    expect(
      await screen.findByText("Não foi possível carregar os detalhes do usuário.")
    ).toBeTruthy();
    fireEvent.press(screen.getByRole("button", { name: "Tentar novamente" }));

    expect(await screen.findByTestId("admin-user-detail-content")).toBeTruthy();
    expect(getUserDetail).toHaveBeenCalledTimes(3);
  });
});
