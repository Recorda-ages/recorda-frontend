import { useQuery } from "@tanstack/react-query";

import { listFollowers } from "../api/friendsApi";

export function useFollowers(userId: string, search: string) {
  return useQuery({
    queryKey: ["friends", "followers", userId, search],
    queryFn: () => listFollowers(userId, search ? { q: search } : {}),
    enabled: !!userId
  });
}
