import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react-native";
import type { PropsWithChildren } from "react";

import { useSignUpMutation } from "@/features/auth/hooks/useSignUpMutation";
import * as registerApi from "@/features/auth/api/register";
import { secureStorage } from "@/services/storage";

jest.mock("@/services/storage", () => ({
  secureStorage: {
    getItem: jest.fn(),
    removeItem: jest.fn(),
    setItem: jest.fn()
  }
}));

describe("useSignUpMutation", () => {
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

  it("stores token in secureStorage when mutation succeeds", async () => {
    jest.spyOn(registerApi, "registerUser").mockResolvedValueOnce({
      access_token: "jwt_token_abc",
      token_type: "bearer",
      user: {
        account_type: "common",
        id: 1,
        username: "eduardo"
      }
    });

    const { result } = renderHook(() => useSignUpMutation(), { wrapper });

    result.current.mutate({
      email: "eduardo@example.com",
      name: "Eduardo",
      password: "password123",
      username: "eduardo"
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(secureStorage.setItem).toHaveBeenCalledWith("auth_token", "jwt_token_abc");
  });

  it("does not store token if mutation fails", async () => {
    jest.spyOn(registerApi, "registerUser").mockRejectedValueOnce(new Error("API failure"));

    const { result } = renderHook(() => useSignUpMutation(), { wrapper });

    result.current.mutate({
      email: "eduardo@example.com",
      name: "Eduardo",
      password: "password123",
      username: "eduardo"
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(secureStorage.setItem).not.toHaveBeenCalled();
  });
});
