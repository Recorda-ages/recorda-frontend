import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react-native";
import React from "react";

import { useRemoveFollower } from "@/features/friends/hooks/useRemoveFollower";
import * as friendsApi from "@/features/friends/api/friendsApi";

jest.mock("@/features/friends/api/friendsApi", () => ({
  listFollowers: jest.fn(),
  listFollowing: jest.fn(),
  removeFollower: jest.fn()
}));

const mockRemoveFollower = friendsApi.removeFollower as jest.Mock;

function wrapper({ children }: { children: React.ReactNode }) {
  const client = new QueryClient({
    defaultOptions: {
      mutations: { gcTime: Infinity, retry: false },
      queries: { gcTime: Infinity, retry: false }
    }
  });
  return React.createElement(QueryClientProvider, { client }, children);
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe("useRemoveFollower", () => {
  it("calls removeFollower with the given followerId", async () => {
    mockRemoveFollower.mockResolvedValueOnce(undefined);

    const { result } = renderHook(() => useRemoveFollower("owner-1"), { wrapper });

    result.current.mutate("follower-42");

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockRemoveFollower).toHaveBeenCalledWith("follower-42");
  });

  it("reflects error state when the API call fails", async () => {
    mockRemoveFollower.mockRejectedValueOnce(new Error("Forbidden"));

    const { result } = renderHook(() => useRemoveFollower("owner-1"), { wrapper });

    result.current.mutate("follower-42");

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toEqual(new Error("Forbidden"));
  });
});
