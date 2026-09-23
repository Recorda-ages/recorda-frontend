import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react-native";
import React from "react";

import { useFollowers } from "@/features/friends/hooks/useFollowers";
import { useFollowing } from "@/features/friends/hooks/useFollowing";
import * as friendsApi from "@/features/friends/api/friendsApi";

jest.mock("@/features/friends/api/friendsApi", () => ({
  listFollowers: jest.fn(),
  listFollowing: jest.fn(),
  removeFollower: jest.fn()
}));

const mockListFollowers = friendsApi.listFollowers as jest.Mock;
const mockListFollowing = friendsApi.listFollowing as jest.Mock;

function wrapper({ children }: { children: React.ReactNode }) {
  const client = new QueryClient({
    defaultOptions: { queries: { gcTime: Infinity, retry: false } }
  });
  return React.createElement(QueryClientProvider, { client }, children);
}

const mockFollowers = [{ id: "1", username: "janedoe", displayName: "Jane Doe", avatarUrl: null }];

beforeEach(() => {
  jest.clearAllMocks();
});

describe("useFollowers", () => {
  it("fetches followers for a given userId", async () => {
    mockListFollowers.mockResolvedValueOnce(mockFollowers);

    const { result } = renderHook(() => useFollowers("user-1", ""), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockFollowers);
    expect(mockListFollowers).toHaveBeenCalledWith("user-1", {});
  });

  it("passes the search string to the API when non-empty", async () => {
    mockListFollowers.mockResolvedValueOnce([]);

    const { result } = renderHook(() => useFollowers("user-1", "jane"), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockListFollowers).toHaveBeenCalledWith("user-1", { q: "jane" });
  });

  it("does not fetch when userId is empty", () => {
    const { result } = renderHook(() => useFollowers("", ""), { wrapper });

    expect(result.current.fetchStatus).toBe("idle");
    expect(mockListFollowers).not.toHaveBeenCalled();
  });

  it("propagates API errors", async () => {
    mockListFollowers.mockRejectedValueOnce(new Error("Network error"));

    const { result } = renderHook(() => useFollowers("user-1", ""), { wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toEqual(new Error("Network error"));
  });
});

describe("useFollowing", () => {
  const mockFollowing = [{ id: "2", username: "bob", displayName: "Bob Smith", avatarUrl: null }];

  it("fetches following for a given userId", async () => {
    mockListFollowing.mockResolvedValueOnce(mockFollowing);

    const { result } = renderHook(() => useFollowing("user-2", ""), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockFollowing);
    expect(mockListFollowing).toHaveBeenCalledWith("user-2", {});
  });

  it("passes the search string to the API when non-empty", async () => {
    mockListFollowing.mockResolvedValueOnce([]);

    const { result } = renderHook(() => useFollowing("user-2", "bob"), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockListFollowing).toHaveBeenCalledWith("user-2", { q: "bob" });
  });

  it("does not fetch when userId is empty", () => {
    const { result } = renderHook(() => useFollowing("", ""), { wrapper });

    expect(result.current.fetchStatus).toBe("idle");
    expect(mockListFollowing).not.toHaveBeenCalled();
  });

  it("propagates API errors", async () => {
    mockListFollowing.mockRejectedValueOnce(new Error("Timeout"));

    const { result } = renderHook(() => useFollowing("user-2", ""), { wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
