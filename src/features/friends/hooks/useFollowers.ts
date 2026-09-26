import { type InfiniteData, useInfiniteQuery } from "@tanstack/react-query";

import { listFollowers } from "../api/friendsApi";
import type { FriendProfile } from "../types";

export const FRIENDS_PAGE_SIZE = 20;

export function useFollowers(userId: string, search: string, enabled = true) {
  return useInfiniteQuery<
    FriendProfile[],
    Error,
    InfiniteData<FriendProfile[], number>,
    ["friends", "followers" | "following", string, string],
    number
  >({
    queryKey: ["friends", "followers", userId, search],
    queryFn: ({ pageParam }) =>
      listFollowers(userId, {
        ...(search ? { q: search } : {}),
        limit: FRIENDS_PAGE_SIZE,
        offset: pageParam
      }),
    enabled: !!userId && enabled,
    getNextPageParam: (lastPage, pages) =>
      lastPage.length < FRIENDS_PAGE_SIZE ? undefined : pages.length * FRIENDS_PAGE_SIZE,
    initialPageParam: 0
  });
}
