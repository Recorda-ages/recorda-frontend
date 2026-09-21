import { useQuery } from "@tanstack/react-query";

import { listFollowing } from "../api/friendsApi";

export function useFollowing(userId: string, search: string) {
  return useQuery({
    queryKey: ["friends", "following", userId, search],
    queryFn: () => listFollowing(userId, search ? { q: search } : {}),
    enabled: !!userId
  });
}
