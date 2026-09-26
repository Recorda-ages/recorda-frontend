import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react-native";
import React from "react";

import { useUserSearch } from "@/features/user-search/hooks/useUserSearch";
import { userSearchService } from "@/features/user-search/services/userSearchService";

jest.mock("@/features/user-search/services/userSearchService", () => ({
  userSearchService: { searchUsers: jest.fn() }
}));

const mockSearchUsers = userSearchService.searchUsers as jest.Mock;

function wrapper({ children }: { children: React.ReactNode }) {
  const client = new QueryClient({
    defaultOptions: { queries: { gcTime: Infinity, retry: false } }
  });
  return React.createElement(QueryClientProvider, { client }, children);
}

beforeEach(() => mockSearchUsers.mockReset());

describe("useUserSearch", () => {
  it("returns the users found for a non-empty query", async () => {
    const users = [
      { avatar_url: null, follow_status: "nenhuma", user_id: "user-1", username: "jane_doe" }
    ];
    mockSearchUsers.mockResolvedValueOnce(users);

    const { result } = renderHook(() => useUserSearch("jane"), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(users);
    expect(mockSearchUsers).toHaveBeenCalledWith("jane", expect.any(AbortSignal));
  });

  it("uses the trimmed query", async () => {
    mockSearchUsers.mockResolvedValueOnce([]);

    const { result } = renderHook(() => useUserSearch("  jane  "), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockSearchUsers).toHaveBeenCalledWith("jane", expect.any(AbortSignal));
  });

  // O backend devolve `[]` para `q` vazio sem tocar o banco: a request não deve sair.
  it.each([
    ["empty", ""],
    ["whitespace only", "   "]
  ])("does not fetch when the query is %s", (_label, query) => {
    const { result } = renderHook(() => useUserSearch(query), { wrapper });

    expect(result.current.fetchStatus).toBe("idle");
    expect(mockSearchUsers).not.toHaveBeenCalled();
  });
});
