import { useQuery } from "@tanstack/react-query";

import { USER_SUGGESTIONS_QUERY_KEY } from "@/features/follow/queryKeys";

import { userSearchService } from "../services/userSearchService";

export function useUserSuggestions(enabled: boolean) {
  return useQuery({
    enabled,
    queryFn: ({ signal }) => userSearchService.getSuggestions(signal),
    queryKey: USER_SUGGESTIONS_QUERY_KEY,
    // Refreshed on every visit so profiles followed since then drop out of the list.
    refetchOnMount: "always"
  });
}
