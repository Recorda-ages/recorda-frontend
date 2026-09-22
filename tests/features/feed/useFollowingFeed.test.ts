import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react-native";
import React from "react";

import { useFollowingFeed } from "@/features/feed/hooks/useFollowingFeed";
import { feedService } from "@/features/feed/services/feedService";
import type { FeedPage } from "@/features/feed/types";

jest.mock("@/features/feed/services/feedService", () => ({
  feedService: { getFollowingFeed: jest.fn() }
}));

const mockGetFollowingFeed = feedService.getFollowingFeed as jest.Mock;

const FEED_PAGE: FeedPage = { items: [], next_cursor: null };

function wrapper({ children }: { children: React.ReactNode }) {
  const client = new QueryClient({
    defaultOptions: { queries: { gcTime: Infinity, retry: false } }
  });
  return React.createElement(QueryClientProvider, { client }, children);
}

beforeEach(() => mockGetFollowingFeed.mockReset());

describe("useFollowingFeed", () => {
  it("fetches the following feed when enabled", async () => {
    mockGetFollowingFeed.mockResolvedValueOnce(FEED_PAGE);

    const { result } = renderHook(() => useFollowingFeed(true), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(FEED_PAGE);
    expect(mockGetFollowingFeed).toHaveBeenCalledTimes(1);
  });

  it("does not fetch when disabled", () => {
    const { result } = renderHook(() => useFollowingFeed(false), { wrapper });

    expect(result.current.isPending).toBe(true);
    expect(result.current.fetchStatus).toBe("idle");
    expect(mockGetFollowingFeed).not.toHaveBeenCalled();
  });

  it("returns error state on failure", async () => {
    mockGetFollowingFeed.mockRejectedValueOnce(new Error("network error"));

    const { result } = renderHook(() => useFollowingFeed(true), { wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
