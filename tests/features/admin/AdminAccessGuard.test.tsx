import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react-native";
import { Text } from "react-native";

import { AdminAccessGuard } from "@/features/admin/components/AdminAccessGuard";
import { AUTH_ME_QUERY_KEY } from "@/features/auth/api/getCurrentUser";
import type { UserBasicResponse } from "@/features/auth/api/types";

const mockReset = jest.fn();
const mockNavigation = { reset: mockReset };

jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual("@react-navigation/native"),
  useNavigation: () => mockNavigation
}));

function user(overrides: Partial<UserBasicResponse> = {}): UserBasicResponse {
  return {
    name: "Usuário",
    onboarding_completed: true,
    role: "USER",
    user_id: "user-1",
    username: "usuario",
    ...overrides
  };
}

function renderGuard(currentUser?: UserBasicResponse) {
  const client = new QueryClient({
    defaultOptions: { queries: { gcTime: 0, retry: false } }
  });
  if (currentUser) {
    client.setQueryData(AUTH_ME_QUERY_KEY, currentUser);
  }

  return render(
    <QueryClientProvider client={client}>
      <AdminAccessGuard>
        <Text>conteúdo administrativo</Text>
      </AdminAccessGuard>
    </QueryClientProvider>
  );
}

describe("AdminAccessGuard", () => {
  beforeEach(() => jest.clearAllMocks());

  it("renders the protected content for an administrator", () => {
    renderGuard(user({ role: "ADMIN" }));

    expect(screen.getByText("conteúdo administrativo")).toBeTruthy();
    expect(mockReset).not.toHaveBeenCalled();
  });

  it("redirects a regular user to their normal destination", async () => {
    renderGuard(user());

    expect(screen.queryByText("conteúdo administrativo")).toBeNull();
    await waitFor(() =>
      expect(mockReset).toHaveBeenCalledWith({ index: 0, routes: [{ name: "Feed" }] })
    );
  });

  it("redirects to Login when there is no authenticated user", async () => {
    renderGuard();

    await waitFor(() =>
      expect(mockReset).toHaveBeenCalledWith({ index: 0, routes: [{ name: "Login" }] })
    );
  });
});
