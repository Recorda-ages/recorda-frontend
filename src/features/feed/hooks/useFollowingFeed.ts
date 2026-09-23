import { type InfiniteData, useInfiniteQuery } from "@tanstack/react-query";

import { feedService } from "../services/feedService";
import type { FeedPage } from "../types";

export function useFollowingFeed(enabled: boolean) {
  return useInfiniteQuery<
    FeedPage,
    Error,
    InfiniteData<FeedPage, string | null>,
    ["feed", "following"],
    string | null
  >({
    enabled,
    getNextPageParam: (lastPage) => lastPage.next_cursor ?? undefined,
    initialPageParam: null as string | null,
    queryFn: ({ pageParam, signal }) => feedService.getFollowingFeed(pageParam, signal),
    queryKey: ["feed", "following"]
  });
}
