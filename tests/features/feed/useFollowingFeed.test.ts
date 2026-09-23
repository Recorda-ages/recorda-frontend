import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react-native";
import React from "react";

import { useFollowingFeed } from "@/features/feed/hooks/useFollowingFeed";
import { feedService } from "@/features/feed/services/feedService";
import type { FeedPage } from "@/features/feed/types";

jest.mock("@/features/feed/services/feedService", () => ({
  feedService: { getFollowingFeed: jest.fn() }
}));

const mockGetFollowingFeed = feedService.getFollowingFeed as jest.Mock;

const FEED_PAGE: FeedPage = { items: [], next_cursor: null };

function createWrapper() {
  const client = new QueryClient({
    defaultOptions: { queries: { gcTime: Infinity, retry: false } }
  });

  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(QueryClientProvider, { client }, children);
  };
}

beforeEach(() => mockGetFollowingFeed.mockReset());

describe("useFollowingFeed", () => {
  it("fetches the following feed when enabled", async () => {
    mockGetFollowingFeed.mockResolvedValueOnce(FEED_PAGE);

    const { result } = renderHook(() => useFollowingFeed(true), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.pages).toEqual([FEED_PAGE]);
    expect(mockGetFollowingFeed).toHaveBeenCalledTimes(1);
    expect(mockGetFollowingFeed).toHaveBeenCalledWith(null, expect.anything());
  });

  it("does not fetch when disabled", () => {
    const { result } = renderHook(() => useFollowingFeed(false), { wrapper: createWrapper() });

    expect(result.current.isPending).toBe(true);
    expect(result.current.fetchStatus).toBe("idle");
    expect(mockGetFollowingFeed).not.toHaveBeenCalled();
  });

  it("returns error state on failure", async () => {
    mockGetFollowingFeed.mockRejectedValueOnce(new Error("network error"));

    const { result } = renderHook(() => useFollowingFeed(true), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });

  it("uses the next cursor to fetch another page", async () => {
    const firstPage: FeedPage = { items: [], next_cursor: "next-cursor" };
    const secondPage: FeedPage = { items: [], next_cursor: null };
    mockGetFollowingFeed.mockResolvedValueOnce(firstPage).mockResolvedValueOnce(secondPage);

    const { result } = renderHook(() => useFollowingFeed(true), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    let fetchedPages: FeedPage[] | undefined;
    await act(async () => {
      const nextResult = await result.current.fetchNextPage();
      fetchedPages = nextResult.data?.pages;
    });

    expect(mockGetFollowingFeed).toHaveBeenNthCalledWith(2, "next-cursor", expect.anything());
    expect(fetchedPages).toEqual([firstPage, secondPage]);
  });
});
