import { type InfiniteData, useInfiniteQuery } from "@tanstack/react-query";

import { feedService } from "../services/feedService";
import type { FeedPage } from "../types";

export function useGeneralFeed(enabled: boolean) {
  return useInfiniteQuery<
    FeedPage,
    Error,
    InfiniteData<FeedPage, string | null>,
    ["feed", "general"],
    string | null
  >({
    enabled,
    getNextPageParam: (lastPage) => lastPage.next_cursor ?? undefined,
    initialPageParam: null as string | null,
    queryFn: ({ pageParam, signal }) => feedService.getGeneralFeed(pageParam, signal),
    queryKey: ["feed", "general"]
  });
}
