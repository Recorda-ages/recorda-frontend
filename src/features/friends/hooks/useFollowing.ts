import { type InfiniteData, useInfiniteQuery } from "@tanstack/react-query";

import { listFollowing } from "../api/friendsApi";
import type { FriendProfile } from "../types";
import { FRIENDS_PAGE_SIZE } from "./useFollowers";

export function useFollowing(userId: string, search: string, enabled = true) {
  return useInfiniteQuery<
    FriendProfile[],
    Error,
    InfiniteData<FriendProfile[], number>,
    ["friends", "followers" | "following", string, string],
    number
  >({
    queryKey: ["friends", "following", userId, search],
    queryFn: ({ pageParam }) =>
      listFollowing(userId, {
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
