import { useQuery } from "@tanstack/react-query";

import { feedService } from "../services/feedService";

export function useFollowingFeed(enabled: boolean) {
  return useQuery({
    enabled,
    queryFn: ({ signal }) => feedService.getFollowingFeed(signal),
    queryKey: ["feed", "following"]
  });
}
