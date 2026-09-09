import { useQuery } from "@tanstack/react-query";
import { musicService } from "../services/musicService";

export function useTrackSearch(q: string) {
  const query = q.trim();

  return useQuery({
    enabled: query.length > 0,
    queryFn: () => musicService.searchTracks(query),
    queryKey: ["music", "tracks", query],
    staleTime: 0
  });
}
