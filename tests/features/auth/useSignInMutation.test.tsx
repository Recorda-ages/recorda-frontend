import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react-native";
import type { PropsWithChildren } from "react";

import * as signInApi from "@/features/auth/api/signIn";
import { useSignInMutation } from "@/features/auth/hooks/useSignInMutation";
import { secureStorage } from "@/services/storage";

jest.mock("@/services/storage", () => ({
  secureStorage: {
    getItem: jest.fn(),
    removeItem: jest.fn(),
    setItem: jest.fn()
  }
}));

describe("useSignInMutation", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    jest.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: {
        mutations: { gcTime: Infinity, retry: false },
        queries: { gcTime: Infinity, retry: false }
      }
    });
  });

  afterEach(() => {
    queryClient.clear();
  });

  const wrapper = ({ children }: PropsWithChildren) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  it("stores token and account type when login succeeds", async () => {
    jest.spyOn(signInApi, "signInUser").mockResolvedValueOnce({
      access_token: "jwt_login_token",
      token_type: "bearer",
      user: {
        account_type: "admin",
        id: 1,
        username: "admin"
      }
    });

    const { result } = renderHook(() => useSignInMutation(), { wrapper });

    result.current.mutate({
      password: "senha123",
      username: "admin"
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(secureStorage.setItem).toHaveBeenCalledWith("auth_token", "jwt_login_token");
    expect(secureStorage.setItem).toHaveBeenCalledWith("account_type", "admin");
  });

  it("does not store session data when login fails", async () => {
    jest.spyOn(signInApi, "signInUser").mockRejectedValueOnce(new Error("Invalid credentials"));

    const { result } = renderHook(() => useSignInMutation(), { wrapper });

    result.current.mutate({
      password: "senha123",
      username: "eduardo"
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(secureStorage.setItem).not.toHaveBeenCalled();
  });
});
