import { useQuery } from "@tanstack/react-query";
import { musicService } from "../services/musicService";

export function useTrackSearch(q: string) {
  return useQuery({
    queryKey: ["music", "tracks", q],
    queryFn: () => musicService.searchTracks(q),
    enabled: q.trim().length > 0
  });
}
