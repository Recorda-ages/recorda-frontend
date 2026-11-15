import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { musicService } from "../services/musicService";

export function useTrackSearch(q: string) {
  const query = q.trim();

  return useQuery({
    enabled: query.length > 0,
    placeholderData: keepPreviousData,
    queryFn: ({ signal }) => musicService.searchTracks(query, signal),
    queryKey: ["music", "tracks", query],
    retry: false,
    staleTime: 0
  });
}
